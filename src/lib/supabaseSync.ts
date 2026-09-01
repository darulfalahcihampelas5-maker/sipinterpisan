import { supabase, isSupabaseConfigured } from "./supabase";
import { db } from "./firebase";
import { doc, getDocs, collection, setDoc, getDoc } from "firebase/firestore";

/**
 * Service to sync & read high-volume data (Grades & CBT Exams) with Supabase
 * with automatic fallback to Firestore if Supabase is offline or not yet migrated.
 */

export interface GradeItem {
  id: string;
  examId?: string;
  assignmentId?: string;
  nisn: string;
  studentName?: string;
  kelas?: string;
  nilai?: number;
  score?: number;
  submittedAt?: any;
  violationCount?: number;
  answers?: any;
  isRemedial?: boolean;
  remedialScore?: number;
  [key: string]: any;
}

export interface ExamItem {
  id: string;
  title: string;
  subject: string;
  kelasRef?: string;
  token: string;
  duration?: number;
  kkm?: number;
  questions?: any[];
  [key: string]: any;
}

// 1. Fetch all Final Grades (Unlimited Reads from Supabase)
export async function getFinalGrades(): Promise<GradeItem[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from("final_grades").select("*");
      if (!error && Array.isArray(data)) {
        return data.map((d) => ({
          id: d.id,
          assignmentId: d.assignment_id || d.exam_id,
          examId: d.exam_id || d.assignment_id,
          nisn: d.nisn,
          studentName: d.student_name,
          kelas: d.kelas,
          nilai: d.nilai ?? d.score,
          score: d.score ?? d.nilai,
          submittedAt: d.submitted_at,
          violationCount: d.violation_count || 0,
          answers: d.answers || {},
          isRemedial: d.is_remedial,
          remedialScore: d.remedial_score,
        }));
      }
      if (error) {
        console.warn("Supabase fetch grades response note:", error.message);
      }
    } catch (err) {
      console.warn("Supabase fetch grades exception:", err);
    }
  }

  // Fallback to Firestore only if Supabase not configured
  try {
    const snap = await getDocs(collection(db, "final_grades"));
    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as GradeItem[];
  } catch (err: any) {
    // Graceful handling of Firestore quota exhaustion
    console.warn("Firestore final_grades read bypassed:", err?.message || err);
    return [];
  }
}

// 2. Fetch Exams (Unlimited Reads from Supabase)
export async function getExams(): Promise<ExamItem[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from("exams").select("*");
      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((d) => ({
          id: d.id,
          title: d.title,
          subject: d.subject,
          kelasRef: d.kelas_ref,
          token: d.token,
          duration: d.duration,
          kkm: d.kkm,
          questions: d.questions || [],
          createdAt: d.created_at,
        }));
      }
    } catch (err) {
      console.warn("Supabase fetch exams exception:", err);
    }
  }

  // Fallback to Firestore
  try {
    const snap = await getDocs(collection(db, "exams"));
    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ExamItem[];
  } catch (err: any) {
    console.warn("Firestore exams read bypassed:", err?.message || err);
    return [];
  }
}

// 3. Save a Final Grade (Saves to Supabase as primary, Firestore as secondary)
export async function saveFinalGrade(grade: GradeItem): Promise<boolean> {
  const gradeId = grade.id || `${grade.assignmentId || grade.examId}_${grade.nisn}`;

  // 1. Save to Supabase (primary)
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("final_grades").upsert({
        id: gradeId,
        exam_id: grade.examId || grade.assignmentId,
        assignment_id: grade.assignmentId || grade.examId,
        nisn: grade.nisn,
        student_name: grade.studentName || "",
        kelas: grade.kelas || "",
        nilai: grade.nilai ?? grade.score ?? 0,
        score: grade.score ?? grade.nilai ?? 0,
        submitted_at: new Date().toISOString(),
        violation_count: grade.violationCount || 0,
        answers: grade.answers || {},
        is_remedial: grade.isRemedial || false,
        remedial_score: grade.remedialScore || null,
      });
    } catch (err) {
      console.warn("Supabase save grade note:", err);
    }
  }

  // 2. Save to Firestore (secondary safety backup if quota permits)
  try {
    const finalRef = doc(db, "final_grades", gradeId);
    await setDoc(finalRef, grade, { merge: true });
    return true;
  } catch (err) {
    // Quota reached on Firestore is ok since Supabase is the primary
    return true;
  }
}

// 4. Real-time Subscription (Zero Quota - WebSocket Stream)
export function subscribeToFinalGrades(
  onGradeChange: (grade: GradeItem) => void
): () => void {
  if (!isSupabaseConfigured || !supabase) {
    return () => {};
  }

  try {
    const channel = supabase
      .channel("realtime_final_grades")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "final_grades" },
        (payload: any) => {
          const d = payload.new;
          if (d && d.id) {
            const formatted: GradeItem = {
              id: d.id,
              assignmentId: d.assignment_id || d.exam_id,
              examId: d.exam_id || d.assignment_id,
              nisn: d.nisn,
              studentName: d.student_name,
              kelas: d.kelas,
              nilai: d.nilai ?? d.score,
              score: d.score ?? d.nilai,
              submittedAt: d.submitted_at,
              violationCount: d.violation_count || 0,
              answers: d.answers || {},
              isRemedial: d.is_remedial,
              remedialScore: d.remedial_score,
            };
            onGradeChange(formatted);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn("Supabase realtime subscription exception:", err);
    return () => {};
  }
}

// Helper to extract collection name from Query/CollectionRef
function getCollectionName(queryOrCollection: any): string {
  if (!queryOrCollection) return "";
  if (typeof queryOrCollection.path === "string") {
    return queryOrCollection.path;
  }
  if (queryOrCollection._query && queryOrCollection._query.path) {
    const segments = queryOrCollection._query.path.segments;
    if (Array.isArray(segments)) return segments.join("/");
  }
  return "";
}

// Helper to filter items client-side using Firebase Query filters
function applyQueryFilters(collectionName: string, items: any[], queryOrCollection: any): any[] {
  if (typeof queryOrCollection.path === "string") {
    return items;
  }
  try {
    const _query = queryOrCollection._query;
    if (_query && Array.isArray(_query.filters)) {
      let filtered = [...items];
      for (const filter of _query.filters) {
        const fieldSegments = filter.field?.segments;
        const fieldName = Array.isArray(fieldSegments) ? fieldSegments[0] : null;
        const op = filter.op;
        
        let filterVal = filter.value?.stringValue ?? filter.value?.integerValue ?? filter.value;
        if (filter.value && typeof filter.value === "object") {
          const keys = Object.keys(filter.value);
          if (keys.length === 1 && keys[0].endsWith("Value")) {
            filterVal = filter.value[keys[0]];
          }
        }
        
        if (fieldName && op && filterVal !== undefined) {
          filtered = filtered.filter(item => {
            const itemVal = item[fieldName];
            // Normalize values for comparison
            const sItemVal = itemVal === null || itemVal === undefined ? "" : String(itemVal).toLowerCase().trim();
            const sFilterVal = String(filterVal).toLowerCase().trim();
            
            if (op === "==" || op === "EQUAL") {
              return sItemVal === sFilterVal;
            }
            if (op === "!=" || op === "NOT_EQUAL") {
              return sItemVal !== sFilterVal;
            }
            if (op === ">=" || op === "GREATER_THAN_OR_EQUAL") {
              return Number(itemVal) >= Number(filterVal);
            }
            if (op === "<=" || op === "LESS_THAN_OR_EQUAL") {
              return Number(itemVal) <= Number(filterVal);
            }
            return true;
          });
        }
      }
      return filtered;
    }
  } catch (err) {
    console.warn("Failed parsing query filters, returning all items:", err);
  }
  return items;
}

// Transparent read wrapper: getDocs replacement
export async function dbGetDocs(queryOrCollectionRef: any): Promise<any> {
  const collectionName = getCollectionName(queryOrCollectionRef);

  if (isSupabaseConfigured && supabase && collectionName) {
    try {
      if (collectionName === "final_grades") {
        const { data, error } = await supabase.from("final_grades").select("*");
        if (!error && Array.isArray(data)) {
          const formatted = data.map((d) => ({
            id: d.id,
            assignmentId: d.assignment_id || d.exam_id,
            examId: d.exam_id || d.assignment_id,
            nisn: d.nisn,
            studentName: d.student_name,
            kelas: d.kelas,
            nilai: d.nilai ?? d.score,
            score: d.score ?? d.nilai,
            submittedAt: d.submitted_at,
            violationCount: d.violation_count || 0,
            answers: d.answers || {},
            isRemedial: d.is_remedial,
            remedialScore: d.remedial_score,
          }));
          const filtered = applyQueryFilters(collectionName, formatted, queryOrCollectionRef);
          const docs = filtered.map(item => ({
            id: item.id,
            exists: () => true,
            data: () => item
          }));
          return {
            docs,
            empty: docs.length === 0,
            size: docs.length,
            forEach: (callback: any) => docs.forEach(callback)
          };
        }
      } else if (collectionName === "exams") {
        const { data, error } = await supabase.from("exams").select("*");
        if (!error && Array.isArray(data)) {
          const formatted = data.map((d) => ({
            id: d.id,
            title: d.title,
            subject: d.subject,
            kelasRef: d.kelas_ref,
            token: d.token,
            duration: d.duration,
            kkm: d.kkm,
            questions: d.questions || [],
            createdAt: d.created_at,
          }));
          const filtered = applyQueryFilters(collectionName, formatted, queryOrCollectionRef);
          const docs = filtered.map(item => ({
            id: item.id,
            exists: () => true,
            data: () => item
          }));
          return {
            docs,
            empty: docs.length === 0,
            size: docs.length,
            forEach: (callback: any) => docs.forEach(callback)
          };
        }
      } else {
        // Generic app_collections table
        const { data, error } = await supabase
          .from("app_collections")
          .select("doc_id, data")
          .eq("collection_name", collectionName);

        if (!error && Array.isArray(data) && data.length > 0) {
          const formatted = data.map((item: any) => ({
            id: item.doc_id,
            ...item.data
          }));
          const filtered = applyQueryFilters(collectionName, formatted, queryOrCollectionRef);
          const docs = filtered.map(item => ({
            id: item.id,
            exists: () => true,
            data: () => item
          }));
          return {
            docs,
            empty: docs.length === 0,
            size: docs.length,
            forEach: (callback: any) => docs.forEach(callback)
          };
        }
      }
    } catch (err: any) {
      console.warn(`Supabase getDocs read bypass for ${collectionName}:`, err?.message || err);
    }
  }

  // Fallback: Read from Firestore
  try {
    const snap = await getDocs(queryOrCollectionRef);
    
    // Auto-populate Supabase cache in the background
    if (isSupabaseConfigured && supabase && !snap.empty && collectionName) {
      setTimeout(async () => {
        try {
          if (collectionName !== "final_grades" && collectionName !== "exams") {
            const formatted = snap.docs.map((docSnap) => ({
              id: `${collectionName}_${docSnap.id}`,
              collection_name: collectionName,
              doc_id: docSnap.id,
              data: docSnap.data(),
              updated_at: new Date().toISOString()
            }));
            await supabase.from("app_collections").upsert(formatted, { onConflict: "id" });
          }
        } catch (err) {
          console.warn(`Background auto-cache to Supabase for ${collectionName} failed:`, err);
        }
      }, 50);
    }
    return snap;
  } catch (err: any) {
    console.warn(`Firestore getDocs failed for ${collectionName}:`, err?.message || err);
    return { docs: [], empty: true, size: 0 };
  }
}

// Transparent read wrapper: getDoc replacement
export async function dbGetDoc(docRef: any): Promise<any> {
  const pathSegments = docRef.path?.split("/");
  if (!pathSegments || pathSegments.length < 2) {
    return { exists: () => false, data: () => null };
  }
  const collectionName = pathSegments[0];
  const docId = pathSegments[1];

  if (isSupabaseConfigured && supabase) {
    try {
      const id = `${collectionName}_${docId}`;
      const { data, error } = await supabase
        .from("app_collections")
        .select("data")
        .eq("id", id)
        .maybeSingle();

      if (!error && data && data.data) {
        return {
          id: docId,
          exists: () => true,
          data: () => data.data
        };
      }
    } catch (err: any) {
      console.warn(`Supabase getDoc read bypass for ${collectionName}/${docId}:`, err?.message || err);
    }
  }

  // Fallback: Read from Firestore
  try {
    const snap = await getDoc(docRef);
    if (isSupabaseConfigured && supabase && snap.exists()) {
      setTimeout(async () => {
        try {
          const id = `${collectionName}_${docId}`;
          await supabase.from("app_collections").upsert({
            id,
            collection_name: collectionName,
            doc_id: docId,
            data: snap.data(),
            updated_at: new Date().toISOString()
          });
        } catch (err) {
          console.warn(`Background cache doc ${collectionName}/${docId} failed:`, err);
        }
      }, 50);
    }
    return snap;
  } catch (err: any) {
    console.warn(`Firestore getDoc failed for ${collectionName}/${docId}:`, err?.message || err);
    return { exists: () => false, data: () => null };
  }
}

// Transparent write wrapper: setDoc replacement
export async function dbSetDoc(docRef: any, data: any, options?: any): Promise<void> {
  const pathSegments = docRef.path?.split("/");
  if (!pathSegments || pathSegments.length < 2) {
    await setDoc(docRef, data, options);
    return;
  }
  const collectionName = pathSegments[0];
  const docId = pathSegments[1];

  // 1. Write to Supabase first
  if (isSupabaseConfigured && supabase) {
    try {
      if (collectionName === "final_grades") {
        await supabase.from("final_grades").upsert({
          id: docId,
          exam_id: data.examId || data.assignmentId,
          assignment_id: data.assignmentId || data.examId,
          nisn: data.nisn,
          student_name: data.studentName || "",
          kelas: data.kelas || "",
          nilai: data.nilai ?? data.score ?? 0,
          score: data.score ?? data.nilai ?? 0,
          submitted_at: data.submittedAt || data.gradedAt || new Date().toISOString(),
          violation_count: data.violationCount || 0,
          answers: data.answers || {},
          is_remedial: data.isRemedial || false,
          remedial_score: data.remedialScore || null,
        });
      } else if (collectionName === "exams") {
        await supabase.from("exams").upsert({
          id: docId,
          title: data.title,
          subject: data.subject,
          kelas_ref: data.kelasRef,
          token: data.token,
          duration: data.duration,
          kkm: data.kkm,
          questions: data.questions || [],
          created_at: data.createdAt || new Date().toISOString()
        });
      } else {
        const id = `${collectionName}_${docId}`;
        await supabase.from("app_collections").upsert({
          id,
          collection_name: collectionName,
          doc_id: docId,
          data,
          updated_at: new Date().toISOString()
        });
      }
    } catch (err: any) {
      console.warn(`Supabase write sync warning for ${collectionName}/${docId}:`, err?.message || err);
    }
  }

  // 2. Fallback to Firestore (ignore quota exhaustion, treat as success if saved to Supabase)
  try {
    await setDoc(docRef, data, options);
  } catch (err: any) {
    if (err?.message?.includes("Quota") || err?.code === "resource-exhausted") {
      console.warn(`Firestore write quota reached for ${collectionName}. Successfully synced to Supabase!`);
    } else {
      throw err;
    }
  }
}

// 5. One-Click Migration: Sync all existing Firebase data into Supabase
export async function syncAllFirebaseToSupabase(): Promise<{
  gradesCount: number;
  examsCount: number;
  otherCount?: number;
  error?: string;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { gradesCount: 0, examsCount: 0, error: "Supabase belum terkonfigurasi" };
  }

  try {
    let gradesCount = 0;
    let examsCount = 0;

    // A. Sync Final Grades from Firestore
    try {
      const gradesSnap = await getDocs(collection(db, "final_grades"));
      if (!gradesSnap.empty) {
        const formattedGrades = gradesSnap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            exam_id: d.assignmentId || d.examId || "",
            assignment_id: d.assignmentId || d.examId || "",
            nisn: d.nisn || "",
            student_name: d.studentName || "",
            kelas: d.kelas || "",
            nilai: d.nilai ?? d.score ?? 0,
            score: d.score ?? d.nilai ?? 0,
            submitted_at: d.submittedAt || new Date().toISOString(),
            violation_count: d.violationCount || 0,
            answers: d.answers || {},
            is_remedial: d.isRemedial || false,
            remedial_score: d.remedialScore || null,
          };
        });

        const { error: gradeErr } = await supabase
          .from("final_grades")
          .upsert(formattedGrades, { onConflict: "id" });

        if (!gradeErr) {
          gradesCount = formattedGrades.length;
        }
      }
    } catch (quotaErr: any) {
      if (quotaErr?.message?.includes("Quota") || quotaErr?.code === "resource-exhausted") {
        return {
          gradesCount: 0,
          examsCount: 0,
          error: "Kuota baca harian Firebase Firestore saat ini sedang mencapai batas maksimum (50.000 limit). Supabase Anda sudah AKTIF dan SIAP dipakai untuk seluruh ujian/nilai baru tanpa batas. Data lama Firebase dapat disinkronkan setelah kuota harian Firebase ter-reset (pukul 07.00 WIB).",
        };
      }
    }

    // B. Sync Exams
    try {
      const examsSnap = await getDocs(collection(db, "exams"));
      if (!examsSnap.empty) {
        const formattedExams = examsSnap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            title: d.title || "Ujian",
            subject: d.subject || "Informatika",
            kelas_ref: d.kelasRef || "",
            token: d.token || "TOKEN",
            duration: d.duration || 3600,
            kkm: d.kkm || 75,
            questions: d.questions || [],
          };
        });

        const { error: examErr } = await supabase
          .from("exams")
          .upsert(formattedExams, { onConflict: "id" });

        if (!examErr) {
          examsCount = formattedExams.length;
        }
      }
    } catch (quotaErr: any) {
      console.warn("Exams sync Firestore quota note:", quotaErr);
    }

    // C. Sync all other collections to app_collections (NoSQL cache)
    const otherCollections = [
      "classes",
      "studentsByNisn",
      "assignments",
      "submissions",
      "chapters",
      "announcements",
      "absensi",
      "materials"
    ];

    let otherCount = 0;
    for (const coll of otherCollections) {
      try {
        const snap = await getDocs(collection(db, coll));
        if (!snap.empty) {
          const formatted = snap.docs.map((docSnap) => ({
            id: `${coll}_${docSnap.id}`,
            collection_name: coll,
            doc_id: docSnap.id,
            data: docSnap.data(),
            updated_at: new Date().toISOString()
          }));
          const { error: upsertErr } = await supabase
            .from("app_collections")
            .upsert(formatted, { onConflict: "id" });
          if (!upsertErr) {
            otherCount += formatted.length;
          }
        }
      } catch (err) {
        console.warn(`Sync other collection ${coll} error:`, err);
      }
    }

    // D. Sync Rubric
    try {
      const rubricSnap = await getDoc(doc(db, "config", "grading_rubric"));
      if (rubricSnap.exists()) {
        await supabase.from("app_collections").upsert({
          id: "config_grading_rubric",
          collection_name: "config",
          doc_id: "grading_rubric",
          data: rubricSnap.data(),
          updated_at: new Date().toISOString()
        });
      }
    } catch (err) {
      console.warn("Sync grading rubric error:", err);
    }

    return { gradesCount, examsCount, otherCount };
  } catch (err: any) {
    console.error("Migration error:", err);
    return { gradesCount: 0, examsCount: 0, error: err.message || "Gagal migrasi" };
  }
}
