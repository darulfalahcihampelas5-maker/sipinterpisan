/**
 * Utility functions for verifying if an assignment or exam is published/targeted
 * to a specific class.
 */

export const normalizeClassName = (cls: string): string => {
  return (cls || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/^(kelas|tingkat|rombel|jenjang)\s*/i, "")
    .replace(/[\s\-_.]+/g, "");
};

export const isAllClasses = (cls: string): boolean => {
  const norm = normalizeClassName(cls);
  return (
    norm === "" ||
    norm === "semuakelas" ||
    norm === "all" ||
    norm === "allclasses" ||
    norm === "semua" ||
    norm === "seluruhkelas" ||
    norm === "pilihjalurkelas" ||
    norm === "semuatugasaktif"
  );
};

export const isClassMatch = (classA: string, classB: string): boolean => {
  if (isAllClasses(classA) || isAllClasses(classB)) return true;
  const normA = normalizeClassName(classA);
  const normB = normalizeClassName(classB);
  if (normA === normB) return true;

  // Grade level matching: e.g. "X" matches "X1", "X2", "X3", "X4", etc.
  if (normA === "x" && normB.startsWith("x")) return true;
  if (normB === "x" && normA.startsWith("x")) return true;
  if (normA === "10" && normB.startsWith("10")) return true;
  if (normB === "10" && normA.startsWith("10")) return true;
  if (normA === "fasee" && (normB.startsWith("x") || normB.startsWith("10"))) return true;
  if (normB === "fasee" && (normA.startsWith("x") || normA.startsWith("10"))) return true;

  return false;
};

export const isAssignmentForClass = (asg: any, targetClass?: string): boolean => {
  if (!asg) return false;
  if (!targetClass || isAllClasses(targetClass)) {
    return true;
  }

  // 1. Explicit targets array (highest priority for multi-class assignments)
  if (Array.isArray(asg.targets) && asg.targets.length > 0) {
    const hasMatch = asg.targets.some((t: any) => {
      const raw = typeof t === "string" ? t : (t?.kelas || t?.name || t?.className || "");
      return isClassMatch(raw, targetClass);
    });
    if (hasMatch) return true;
  }

  // 2. targetClasses array
  if (Array.isArray(asg.targetClasses) && asg.targetClasses.length > 0) {
    const hasMatch = asg.targetClasses.some((k: any) => isClassMatch(k, targetClass));
    if (hasMatch) return true;
  }

  // 3. selectedClasses array
  if (Array.isArray(asg.selectedClasses) && asg.selectedClasses.length > 0) {
    const hasMatch = asg.selectedClasses.some((k: any) => isClassMatch(k, targetClass));
    if (hasMatch) return true;
  }

  // 4. classes array
  if (Array.isArray(asg.classes) && asg.classes.length > 0) {
    const hasMatch = asg.classes.some((k: any) => isClassMatch(k, targetClass));
    if (hasMatch) return true;
  }

  // 5. kelasRef property
  if (asg.kelasRef) {
    const rawRef = asg.kelasRef.toString();
    if (isAllClasses(rawRef)) return true;
    const splitClasses = rawRef.split(",").map((s: string) => s.trim());
    if (splitClasses.some((s: string) => isClassMatch(s, targetClass))) return true;
  }

  // 6. kelas property fallback
  if (asg.kelas) {
    const rawKelas = asg.kelas.toString();
    if (isAllClasses(rawKelas)) return true;
    const splitClasses = rawKelas.split(",").map((s: string) => s.trim());
    if (splitClasses.some((s: string) => isClassMatch(s, targetClass))) return true;
  }

  // 7. class / grade / rombel properties
  if (asg.class && isClassMatch(asg.class, targetClass)) return true;
  if (asg.grade && isClassMatch(asg.grade, targetClass)) return true;
  if (asg.rombel && isClassMatch(asg.rombel, targetClass)) return true;

  // 8. If no class constraints are defined at all on the document, treat as all classes
  const hasNoClassConstraints =
    (!asg.targets || asg.targets.length === 0) &&
    (!asg.targetClasses || asg.targetClasses.length === 0) &&
    (!asg.selectedClasses || asg.selectedClasses.length === 0) &&
    (!asg.classes || asg.classes.length === 0) &&
    !asg.kelasRef &&
    !asg.kelas &&
    !asg.class &&
    !asg.grade &&
    !asg.rombel;

  if (hasNoClassConstraints) {
    return true;
  }

  return false;
};

export const isExamForClass = (exam: any, targetClass?: string): boolean => {
  if (!exam) return false;
  if (!targetClass || isAllClasses(targetClass)) {
    return true;
  }

  // 1. targetClasses array
  if (Array.isArray(exam.targetClasses) && exam.targetClasses.length > 0) {
    const hasMatch = exam.targetClasses.some((k: any) => isClassMatch(k, targetClass));
    if (hasMatch) return true;
  }

  // 2. Explicit targets array
  if (Array.isArray(exam.targets) && exam.targets.length > 0) {
    const hasMatch = exam.targets.some((t: any) => {
      const raw = typeof t === "string" ? t : (t?.kelas || t?.name || t?.className || "");
      return isClassMatch(raw, targetClass);
    });
    if (hasMatch) return true;
  }

  // 3. selectedClasses array
  if (Array.isArray(exam.selectedClasses) && exam.selectedClasses.length > 0) {
    const hasMatch = exam.selectedClasses.some((k: any) => isClassMatch(k, targetClass));
    if (hasMatch) return true;
  }

  // 4. classes array
  if (Array.isArray(exam.classes) && exam.classes.length > 0) {
    const hasMatch = exam.classes.some((k: any) => isClassMatch(k, targetClass));
    if (hasMatch) return true;
  }

  // 5. kelasRef property
  if (exam.kelasRef) {
    const rawRef = exam.kelasRef.toString();
    if (isAllClasses(rawRef)) return true;
    const splitClasses = rawRef.split(",").map((s: string) => s.trim());
    if (splitClasses.some((s: string) => isClassMatch(s, targetClass))) return true;
  }

  // 6. kelas property fallback
  if (exam.kelas) {
    const rawKelas = exam.kelas.toString();
    if (isAllClasses(rawKelas)) return true;
    const splitClasses = rawKelas.split(",").map((s: string) => s.trim());
    if (splitClasses.some((s: string) => isClassMatch(s, targetClass))) return true;
  }

  // 7. class / grade / rombel properties
  if (exam.class && isClassMatch(exam.class, targetClass)) return true;
  if (exam.grade && isClassMatch(exam.grade, targetClass)) return true;
  if (exam.rombel && isClassMatch(exam.rombel, targetClass)) return true;

  // 8. If no class constraints are defined at all on the document, treat as all classes (e.g. Pretest / Posttest / Umum)
  const hasNoClassConstraints =
    (!exam.targets || exam.targets.length === 0) &&
    (!exam.targetClasses || exam.targetClasses.length === 0) &&
    (!exam.selectedClasses || exam.selectedClasses.length === 0) &&
    (!exam.classes || exam.classes.length === 0) &&
    !exam.kelasRef &&
    !exam.kelas &&
    !exam.class &&
    !exam.grade &&
    !exam.rombel;

  if (hasNoClassConstraints) {
    return true;
  }

  return false;
};
