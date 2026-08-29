/**
 * Utility functions for verifying if an assignment or exam is published/targeted
 * to a specific class.
 */

export const isAssignmentForClass = (asg: any, targetClass?: string): boolean => {
  if (!asg) return false;
  if (!targetClass || targetClass === "SEMUA_KELAS" || targetClass === "ALL" || targetClass.trim() === "") {
    return true;
  }

  const cleanTarget = targetClass.trim().toLowerCase();

  // 1. Explicit targets array (highest priority for multi-class assignments)
  if (Array.isArray(asg.targets) && asg.targets.length > 0) {
    return asg.targets.some((t: any) => {
      const k = (typeof t === "string" ? t : (t?.kelas || t?.name || "")).toString().trim().toLowerCase();
      return k === cleanTarget || k === "semua_kelas" || k === "all" || k === "semua kelas";
    });
  }

  // 2. targetClasses array
  if (Array.isArray(asg.targetClasses) && asg.targetClasses.length > 0) {
    return asg.targetClasses.some((k: any) => {
      const cls = (k || "").toString().trim().toLowerCase();
      return cls === cleanTarget || cls === "semua_kelas" || cls === "all" || cls === "semua kelas";
    });
  }

  // 3. kelasRef property
  if (asg.kelasRef) {
    const rawRef = asg.kelasRef.toString().trim().toLowerCase();
    if (rawRef === "semua_kelas" || rawRef === "all" || rawRef === "semua kelas") return true;
    const splitClasses = rawRef.split(",").map((s: string) => s.trim());
    if (splitClasses.includes(cleanTarget)) return true;
  }

  // 4. kelas property fallback
  if (asg.kelas) {
    const rawKelas = asg.kelas.toString().trim().toLowerCase();
    if (rawKelas === "semua_kelas" || rawKelas === "all" || rawKelas === "semua kelas") return true;
    const splitClasses = rawKelas.split(",").map((s: string) => s.trim());
    if (splitClasses.includes(cleanTarget)) return true;
  }

  return false;
};

export const isExamForClass = (exam: any, targetClass?: string): boolean => {
  if (!exam) return false;
  if (!targetClass || targetClass === "SEMUA_KELAS" || targetClass === "ALL" || targetClass.trim() === "") {
    return true;
  }

  const cleanTarget = targetClass.trim().toLowerCase();

  // 1. targetClasses array
  if (Array.isArray(exam.targetClasses) && exam.targetClasses.length > 0) {
    return exam.targetClasses.some((k: any) => {
      const cls = (k || "").toString().trim().toLowerCase();
      return cls === cleanTarget || cls === "semua_kelas" || cls === "all" || cls === "semua kelas";
    });
  }

  // 2. Explicit targets array
  if (Array.isArray(exam.targets) && exam.targets.length > 0) {
    return exam.targets.some((t: any) => {
      const k = (typeof t === "string" ? t : (t?.kelas || t?.name || "")).toString().trim().toLowerCase();
      return k === cleanTarget || k === "semua_kelas" || k === "all" || k === "semua kelas";
    });
  }

  // 3. kelasRef property
  if (exam.kelasRef) {
    const rawRef = exam.kelasRef.toString().trim().toLowerCase();
    if (rawRef === "semua_kelas" || rawRef === "all" || rawRef === "semua kelas") return true;
    const splitClasses = rawRef.split(",").map((s: string) => s.trim());
    if (splitClasses.includes(cleanTarget)) return true;
  }

  // 4. kelas property fallback
  if (exam.kelas) {
    const rawKelas = exam.kelas.toString().trim().toLowerCase();
    if (rawKelas === "semua_kelas" || rawKelas === "all" || rawKelas === "semua kelas") return true;
    const splitClasses = rawKelas.split(",").map((s: string) => s.trim());
    if (splitClasses.includes(cleanTarget)) return true;
  }

  return false;
};
