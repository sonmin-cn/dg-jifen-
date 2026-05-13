export const leaderDetailSelect = {
  id: true,
  realName: true,
  nickname: true,
  phone: true,
  region: true,
  status: true,
  level: true,
  joinDate: true,
  regularDate: true,
  recommenderLeaderId: true,
  tags: true,
  remark: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      status: true,
    },
  },
  recommenderLeader: {
    select: {
      id: true,
      realName: true,
      nickname: true,
      phone: true,
      status: true,
    },
  },
} as const;
