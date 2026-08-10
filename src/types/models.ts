export type ChurchStatus = 'active' | 'construction' | 'planning' | 'inactive';

export type GroupType =
  | 'youth'
  | 'adults'
  | 'children'
  | 'seniors'
  | 'couples'
  | 'singles'
  | 'women'
  | 'men'
  | 'students'
  | 'professionals'
  | 'mixed';

export type GroupCategory =
  | 'bible_study'
  | 'prayer'
  | 'evangelism'
  | 'discipleship'
  | 'worship'
  | 'service'
  | 'fellowship'
  | 'training'
  | 'mission';

export type GroupStatus = 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';

export type MeetingDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type QuarterPeriod = 'first' | 'second' | 'third' | 'fourth' | 'annual';

export type WeeklyMetricStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export type BibleStudentProgram =
  | 'basic_bible'
  | 'intermediate_bible'
  | 'advanced_bible'
  | 'theology'
  | 'discipleship'
  | 'leadership'
  | 'missions'
  | 'evangelism'
  | 'counseling'
  | 'other';

export type BibleStudentLevel = 'beginner' | 'intermediate' | 'advanced' | 'graduate';

export type BibleStudentStatus = 'enrolled' | 'active' | 'completed' | 'dropped' | 'suspended' | 'graduated';

export type DisciplePairStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export type AttendanceMeetingType = 'regular' | 'special' | 'evangelism' | 'community' | 'prayer' | 'study' | 'other';

export type QuarterlyGoalType = 'comunion' | 'relacionamiento' | 'mision';

export type QuarterlyGoalStatus = 'not_started' | 'in_progress' | 'achieved' | 'missed' | 'cancelled';

export type MemberMaritalStatus = 'single' | 'married' | 'divorced' | 'widowed' | 'other';

export type MemberSpiritualStatus =
  | 'new_believer'
  | 'growing'
  | 'mature'
  | 'leader'
  | 'teacher'
  | 'visitor'
  | 'inactive'
  | 'other';

export type MemberStatus = 'active' | 'inactive' | 'suspended' | 'transferred' | 'graduated';

export type MemberEducation = 'elementary' | 'high_school' | 'technical' | 'university' | 'graduate' | 'other' | 'not_specified';
