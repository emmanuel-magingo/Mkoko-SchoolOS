import { EducationLevel } from '../types/academics.types';

export function getTenantEnabledLevels(tenant?: any, selectedSchool?: any): EducationLevel[] {
  if (tenant?.educationLevels && Array.isArray(tenant.educationLevels) && tenant.educationLevels.length > 0) {
    const raw = tenant.educationLevels.map((el: any) => (typeof el === 'string' ? el : el.level));
    return Array.from(new Set(raw)).filter(Boolean) as EducationLevel[];
  }
  const schoolLevel = (selectedSchool as any)?.schoolLevel || tenant?.schoolLevel;
  if (schoolLevel === 'PRIMARY_ONLY') return ['PRIMARY'];
  if (schoolLevel === 'A_LEVEL_ONLY') return ['A_LEVEL'];
  if (schoolLevel === 'O_AND_A_LEVEL') return ['O_LEVEL', 'A_LEVEL'];
  return ['O_LEVEL'];
}

export function isLevelEnabled(level: EducationLevel, tenant?: any, selectedSchool?: any): boolean {
  return getTenantEnabledLevels(tenant, selectedSchool).includes(level);
}

export function isPrimaryLevel(levelOrName?: string | number | null): boolean {
  if (!levelOrName) return false;
  const str = String(levelOrName).trim().toUpperCase();
  if (/\b(STD|STANDARD|GRADE|DARASA|PRIMARY|CLASS)[ ._-]?(1|2|3|4|5|6|7|I|II|III|IV|V|VI|VII)\b/i.test(str)) return true;
  if (/^(STD|STANDARD|GRADE|DARASA|PRIMARY|CLASS)[ ._-]?[1-7]$/i.test(str)) return true;
  if (/^DARASA LA [1-7]$/i.test(str)) return true;
  if (str === 'PRIMARY') return true;
  if (/^STANDARD[ _-]?[1-7]/i.test(str)) return true;
  if (/^STD[ _-]?[1-7]/i.test(str)) return true;
  if (/^CLASS[ _-]?[1-7]/i.test(str)) return true;
  if (/^GRADE[ _-]?[1-7]/i.test(str)) return true;
  if (str === '7' || str === 'STD 7' || str === 'STANDARD 7') return true;
  return false;
}

export function isAdvancedLevel(levelOrName?: string | number | null): boolean {
  if (!levelOrName) return false;
  const str = String(levelOrName).trim().toUpperCase();
  if (isPrimaryLevel(str)) return false;
  if (str === '5' || str === '6') return true;
  if (str === 'FORM_5' || str === 'FORM_6' || str === 'FORM 5' || str === 'FORM 6') return true;
  if (str === 'A_LEVEL' || str === 'ADVANCED_LEVEL') return true;
  if (/^(FORM|F)[ _-]?(5|6|V|VI)($|[\s-_]|[A-Z])/i.test(str)) return true;
  if (/\b(A[-_ ]?LEVEL|ADVANCED[ _]?LEVEL)\b/i.test(str)) return true;
  return false;
}

export function isOrdinaryLevel(levelOrName?: string | number | null): boolean {
  if (!levelOrName) return false;
  const str = String(levelOrName).trim().toUpperCase();
  if (isPrimaryLevel(str)) return false;
  if (isAdvancedLevel(str)) return false;
  if (str === '1' || str === '2' || str === '3' || str === '4') return true;
  if (str === 'FORM_1' || str === 'FORM_2' || str === 'FORM_3' || str === 'FORM_4') return true;
  if (str === 'O_LEVEL' || str === 'ORDINARY_LEVEL') return true;
  if (/\b(FORM|F)[ _]?(1|2|3|4|I|II|III|IV)\b/i.test(str)) return true;
  if (/^(FORM|F)[ _-]?[1-4]($|[\s-_]|[A-Z])/i.test(str)) return true;
  if (/\b(O[-_ ]?LEVEL|ORDINARY[ _]?LEVEL)\b/i.test(str)) return true;
  return false;
}

export function getEducationLevelFromClass(
  levelOrName?: string | number | null,
  fallbackName?: string | null
): EducationLevel {
  const primaryCandidate = isPrimaryLevel(levelOrName) || (fallbackName && isPrimaryLevel(fallbackName));
  if (primaryCandidate) return 'PRIMARY';

  const advancedCandidate = isAdvancedLevel(levelOrName) || (fallbackName && isAdvancedLevel(fallbackName));
  if (advancedCandidate) return 'A_LEVEL';

  const ordinaryCandidate = isOrdinaryLevel(levelOrName) || (fallbackName && isOrdinaryLevel(fallbackName));
  if (ordinaryCandidate) return 'O_LEVEL';

  return 'O_LEVEL';
}

export function isSubjectApplicableToClass(
  subject: { level?: EducationLevel; applicableClasses?: string[] },
  classObj: { name?: string; level?: string }
): boolean {
  const classLevel = getEducationLevelFromClass(classObj.level || classObj.name);
  if (subject.level && subject.level !== classLevel) {
    return false;
  }
  if (subject.applicableClasses && subject.applicableClasses.length > 0) {
    const cName = (classObj.name || '').trim();
    const cLvl = (classObj.level || '').trim();
    const matches = subject.applicableClasses.some(
      (ac) =>
        ac.toLowerCase() === cName.toLowerCase() ||
        ac.toLowerCase() === cLvl.toLowerCase() ||
        cName.toLowerCase().startsWith(ac.toLowerCase())
    );
    if (!matches) return false;
  }
  return true;
}
