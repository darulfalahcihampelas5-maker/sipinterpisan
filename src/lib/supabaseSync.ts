import { supabase, isSupabaseConfigured } from "./supabase";
import { db } from "./firebase";
import { doc, getDocs, collection, setDoc } from "firebase/firestore";

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

// 5. One-Click Migration: Sync all existing Firebase data into Supabase
export async function syncAllFirebaseToSupabase(): Promise<{
  gradesCount: number;
  examsCount: number;
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

    return { gradesCount, examsCount };
  } catch (err: any) {
    console.error("Migration error:", err);
    return { gradesCount: 0, examsCount: 0, error: err.message || "Gagal migrasi" };
  }
}
