import type { AppData, DayPlan } from './types';

const IMG_HANG_LEG = 'https://images.pexels.com/photos/4803714/pexels-photo-4803714.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
const IMG_CABLE_CHOP = 'https://images.pexels.com/photos/5327498/pexels-photo-5327498.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
const IMG_AB_ROLLER = 'https://images.pexels.com/photos/14100682/pexels-photo-14100682.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
const IMG_LEG_RAISE_2 = 'https://images.pexels.com/photos/4803717/pexels-photo-4803717.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
const IMG_AB_ROLLER_2 = 'https://images.pexels.com/photos/8544616/pexels-photo-8544616.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

export const DAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export function createDefaultWeekPlan(): DayPlan[] {
  return [
    {
      dayIndex: 0,
      label: '周一',
      theme: '推（胸肌 + 肩部 + 三头）',
      exercises: [
        { id: 'p1', name: '杠铃卧推', sets: 4, reps: '8-12', weight: '60', unit: 'kg', images: [], completedSets: 0 },
        { id: 'p2', name: '上斜哑铃推举', sets: 4, reps: '8-12', weight: '30', unit: 'kg', images: [], completedSets: 0 },
        { id: 'p3', name: '哑铃肩推', sets: 3, reps: '10-12', weight: '20', unit: 'kg', images: [], completedSets: 0 },
        { id: 'p4', name: '绳索下压', sets: 3, reps: '12-15', weight: '25', unit: 'kg', images: [], completedSets: 0 },
      ],
    },
    {
      dayIndex: 1,
      label: '周二',
      theme: '拉（背肌 + 二头）',
      exercises: [
        { id: 'l1', name: '引体向上', sets: 4, reps: '8-10', weight: '0', unit: 'kg', images: [], completedSets: 0 },
        { id: 'l2', name: '杠铃划船', sets: 4, reps: '8-12', weight: '50', unit: 'kg', images: [], completedSets: 0 },
        { id: 'l3', name: '高位下拉', sets: 3, reps: '10-12', weight: '45', unit: 'kg', images: [], completedSets: 0 },
        { id: 'l4', name: '哑铃二头弯举', sets: 3, reps: '12-15', weight: '15', unit: 'kg', images: [], completedSets: 0 },
      ],
    },
    {
      dayIndex: 2,
      label: '周三',
      theme: '有氧日',
      exercises: [
        { id: 'c1', name: '龙门架卷腹', sets: 4, reps: '8-12', weight: '20', unit: 'kg', images: [], completedSets: 0 },
        {
          id: 'c2',
          name: '悬垂抬腿',
          sets: 3,
          reps: '15',
          weight: '20',
          unit: 'kg',
          images: [
            { id: 'c2i1', url: IMG_HANG_LEG },
            { id: 'c2i2', url: IMG_LEG_RAISE_2 },
          ],
          completedSets: 0,
        },
        {
          id: 'c3',
          name: '龙门架绳索伐木',
          sets: 3,
          reps: '15',
          weight: '20',
          unit: 'kg',
          images: [{ id: 'c3i1', url: IMG_CABLE_CHOP }],
          completedSets: 0,
        },
        {
          id: 'c4',
          name: '腹轮',
          sets: 3,
          reps: '10-12',
          weight: '20',
          unit: 'kg',
          images: [
            { id: 'c4i1', url: IMG_AB_ROLLER },
            { id: 'c4i2', url: IMG_AB_ROLLER_2 },
          ],
          completedSets: 0,
        },
        { id: 'c5', name: '有氧跑步机', sets: 1, reps: '20', weight: '0', unit: 'min', images: [], completedSets: 0 },
      ],
    },
    {
      dayIndex: 3,
      label: '周四',
      theme: '推（肩部重点 + 上胸 + 三头）',
      exercises: [
        { id: 'p5', name: '坐姿哑铃肩推', sets: 4, reps: '8-12', weight: '22', unit: 'kg', images: [], completedSets: 0 },
        { id: 'p6', name: '上斜杠铃推举', sets: 4, reps: '8-12', weight: '50', unit: 'kg', images: [], completedSets: 0 },
        { id: 'p7', name: '侧平举', sets: 3, reps: '12-15', weight: '10', unit: 'kg', images: [], completedSets: 0 },
        { id: 'p8', name: '俯身三头臂屈伸', sets: 3, reps: '12-15', weight: '15', unit: 'kg', images: [], completedSets: 0 },
      ],
    },
    {
      dayIndex: 4,
      label: '周五',
      theme: '拉 & 核心强化',
      exercises: [
        { id: 'l5', name: '硬拉', sets: 4, reps: '6-8', weight: '80', unit: 'kg', images: [], completedSets: 0 },
        { id: 'l6', name: '单臂哑铃划船', sets: 3, reps: '10-12', weight: '25', unit: 'kg', images: [], completedSets: 0 },
        { id: 'l7', name: '锤式弯举', sets: 3, reps: '12-15', weight: '12', unit: 'kg', images: [], completedSets: 0 },
        { id: 'l8', name: '平板支撑', sets: 3, reps: '60', weight: '0', unit: 'min', images: [], completedSets: 0 },
      ],
    },
    {
      dayIndex: 5,
      label: '周六',
      theme: '休息与拉伸伸展',
      exercises: [
        { id: 'r1', name: '全身拉伸', sets: 1, reps: '15', weight: '0', unit: 'min', images: [], completedSets: 0 },
      ],
    },
    {
      dayIndex: 6,
      label: '周日',
      theme: '休息与恢复',
      exercises: [],
    },
  ];
}

export function createDefaultData(syncKey: string): AppData {
  return {
    version: 1,
    activeDayIndex: 2,
    weekPlan: createDefaultWeekPlan(),
    history: [],
    syncKey,
    lastSyncedAt: null,
  };
}

export function generateSyncKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let key = '';
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) key += '-';
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}
