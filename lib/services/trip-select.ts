export const tripListSelect = {
  id: true,
  routeName: true,
  region: true,
  startDate: true,
  endDate: true,
  tripDays: true,
  status: true,
  participantCount: true,
  productManagerId: true,
  isHoliday: true,
  createdAt: true,
  updatedAt: true,
  tripLeaders: {
    select: {
      id: true,
      leaderId: true,
      role: true,
      actualWorkDays: true,
      isCompleted: true,
      baseScoreGeneratedAt: true,
      baseScoreRecordId: true,
      leader: {
        select: {
          id: true,
          realName: true,
          nickname: true,
          phone: true,
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  },
} as const;
