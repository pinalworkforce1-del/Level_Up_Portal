import day06 from './day-06.js';
import day07 from './day-07.js';
import day08 from './day-08.js';
import day09 from './day-09.js';
import day10 from './day-10.js';

export const days=new Map([
  [6,day06],[7,day07],[8,day08],[9,day09],[10,day10]
]);

export function getDay(day){return days.get(Number(day))||null;}
