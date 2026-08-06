const clamp=(v,min=0,max=1)=>Math.min(Math.max(v,min),max);
const x={users:80,minutesSavedPerUserWeek:35,loadedHourlyRate:85,workWeeks:48,adoptionRate:.75,realizationRate:.7};
const productivity=x.users*(x.minutesSavedPerUserWeek/60)*x.loadedHourlyRate*x.workWeeks*clamp(x.adoptionRate)*clamp(x.realizationRate);
if(Math.round(productivity)!==99960) throw new Error(`Unexpected productivity value: ${productivity}`);
console.log('Calculation smoke test passed:',Math.round(productivity));
