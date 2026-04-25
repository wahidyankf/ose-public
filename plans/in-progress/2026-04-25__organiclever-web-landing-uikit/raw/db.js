// db.js — Local-first data layer (localStorage).
// Data model: everything is an Event { id, type, startedAt, finishedAt, labels, payload }
// Types: 'workout' | 'reading' | 'learning' | 'meal' | 'focus' | ...
// Labels: arbitrary string tags for filtering/grouping
// Payload: type-specific structured data
//
// Server API shape (for future sync):
//   POST /events      → saveEvent(event)
//   GET  /events      → getEvents(filter)
//   GET  /events/:id  → getEvents({ id })

(function () {
  const KEY = 'ol_db_v12';
  const uid = () =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2);

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
  }
  function persist(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {} }

  // ── Seed ──────────────────────────────────────────────────────────────────
  const SEED = {
    settings: { name: 'Yoka', restSeconds: 60, darkMode: false },
    routines: [
      {
        id: 'r1', name: 'Kettlebell day', hue: 'teal', type: 'workout',
        createdAt: new Date().toISOString(),
        groups: [
          { id: 'g1', name: 'Kettlebell', exercises: [
            { id:'e1', name:'Low to mid',       targetSets:3, targetReps:20, weight:'8',   bilateral:false, dayStreak:1, restSeconds:null },
            { id:'e2', name:'Mid to up',         targetSets:3, targetReps:20, weight:'8',   bilateral:false, dayStreak:1, restSeconds:null },
            { id:'e3', name:'Front raise',       targetSets:3, targetReps:12, weight:'4+4', bilateral:false, dayStreak:0, restSeconds:null },
            { id:'e4', name:'Tricep',            targetSets:3, targetReps:20, weight:'6',   bilateral:false, dayStreak:2, restSeconds:null },
            { id:'e5', name:'Around the waist', targetSets:3, targetReps:20, weight:'10',  bilateral:true,  dayStreak:2, restSeconds:null },
            { id:'e6', name:'Lateral raise',    targetSets:3, targetReps:11, weight:'4+4', bilateral:false, dayStreak:0, restSeconds:null },
          ]},
        ],
      },
      {
        id: 'r2', name: 'Calisthenics', hue: 'honey', type: 'workout',
        createdAt: new Date().toISOString(),
        groups: [
          { id: 'g3', name: 'Future', exercises: [
            { id:'e7',  name:'Leg up',  targetSets:3, targetReps:16,  type:'reps',     weight:null, bilateral:false, dayStreak:0, restSeconds:null },
            { id:'e8',  name:'Plank',   targetSets:3, targetDuration:30, type:'duration', timerMode:'countdown', weight:null, bilateral:false, dayStreak:0, restSeconds:null },
            { id:'e9',  name:'Back up', targetSets:3, targetReps:12, weight:null, bilateral:false, dayStreak:0, restSeconds:null },
            { id:'e10', name:'Squat',   targetSets:3, targetReps:9,  weight:null, bilateral:false, dayStreak:0, restSeconds:null },
            { id:'e11', name:'Push up', targetSets:3, targetReps:1,  weight:null, bilateral:false, dayStreak:0, restSeconds:null },
          ]},
        ],
      },
      {
        id: 'r3', name: 'Super Exercise', hue: 'plum', featured: true, type: 'workout',
        createdAt: new Date().toISOString(),
        groups: [
          { id:'g4', name:'Circuit A', exercises: [
            { id:'s1', name:'Deadlift',          targetSets:4, targetReps:5,  type:'reps',     weight:'60',  bilateral:false, dayStreak:0, restSeconds:120 },
            { id:'s4', name:'Jumping jacks',     targetSets:1, targetDuration:45, type:'duration', timerMode:'countdown', weight:null, bilateral:false, dayStreak:0, restSeconds:30  },
            { id:'s2', name:'Bench press',       targetSets:4, targetReps:8,  type:'reps',     weight:'40',  bilateral:false, dayStreak:0, restSeconds:90  },
            { id:'s5', name:'Mountain climbers', targetSets:1, targetDuration:30, type:'duration', timerMode:'countdown', weight:null, bilateral:false, dayStreak:0, restSeconds:30  },
          ]},
          { id:'g5', name:'Circuit B', exercises: [
            { id:'s3', name:'Overhead press',    targetSets:3, targetReps:8,  type:'reps',     weight:'20',  bilateral:false, dayStreak:0, restSeconds:90  },
            { id:'s6', name:'Hollow hold',       targetSets:3, targetDuration:20, type:'duration', timerMode:'countdown', weight:null, bilateral:false, dayStreak:0, restSeconds:45  },
            { id:'s7', name:'Dead bug',          targetSets:3, targetReps:10, type:'reps',     weight:null,  bilateral:true,  dayStreak:0, restSeconds:null },
          ]},
          { id:'g6', name:'Cooldown', exercises: [
            { id:'s8', name:'Hip flexor stretch', targetSets:2, targetDuration:40, type:'duration', timerMode:'countdown', weight:null, bilateral:true,  dayStreak:0, restSeconds:15  },
            { id:'s9', name:'Cat-cow',            targetSets:2, targetDuration:30, type:'duration', timerMode:'countup',  weight:null, bilateral:false, dayStreak:0, restSeconds:null },
          ]},
        ],
      },
    ],
    events:   [
      {
            "id": "0o8lliny1xlp",
            "type": "workout",
            "startedAt": "2026-02-21T21:52:47.815Z",
            "finishedAt": "2026-02-21T21:52:47.816Z",
            "labels": [
                  "workout",
                  "Kettlebell day",
                  "r1",
                  "Kettlebell"
            ],
            "payload": {
                  "routineId": "r1",
                  "routineName": "Kettlebell day",
                  "durationSecs": 2280,
                  "exercises": [
                        {
                              "exerciseId": "e1",
                              "groupName": "Kettlebell",
                              "name": "Low to mid",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "8",
                              "sets": [
                                    {
                                          "reps": 18,
                                          "weight": "8"
                                    },
                                    {
                                          "reps": 19,
                                          "weight": "8"
                                    },
                                    {
                                          "reps": 18,
                                          "weight": "8"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e2",
                              "groupName": "Kettlebell",
                              "name": "Mid to up",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "8",
                              "sets": [
                                    {
                                          "reps": 17,
                                          "weight": "8"
                                    },
                                    {
                                          "reps": 18,
                                          "weight": "8"
                                    },
                                    {
                                          "reps": 16,
                                          "weight": "8"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e3",
                              "groupName": "Kettlebell",
                              "name": "Front raise",
                              "targetSets": 3,
                              "targetReps": 12,
                              "targetWeight": "4+4",
                              "sets": [
                                    {
                                          "reps": 10,
                                          "weight": "4+4"
                                    },
                                    {
                                          "reps": 11,
                                          "weight": "4+4"
                                    },
                                    {
                                          "reps": 10,
                                          "weight": "4+4"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e4",
                              "groupName": "Kettlebell",
                              "name": "Tricep",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "6",
                              "sets": [
                                    {
                                          "reps": 18,
                                          "weight": "6"
                                    },
                                    {
                                          "reps": 17,
                                          "weight": "6"
                                    },
                                    {
                                          "reps": 16,
                                          "weight": "6"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e5",
                              "groupName": "Kettlebell",
                              "name": "Around the waist",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "10",
                              "sets": [
                                    {
                                          "reps": 18,
                                          "weight": "10"
                                    },
                                    {
                                          "reps": 17,
                                          "weight": "10"
                                    },
                                    {
                                          "reps": 18,
                                          "weight": "10"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e6",
                              "groupName": "Kettlebell",
                              "name": "Lateral raise",
                              "targetSets": 3,
                              "targetReps": 11,
                              "targetWeight": "4+4",
                              "sets": [
                                    {
                                          "reps": 10,
                                          "weight": "4+4"
                                    },
                                    {
                                          "reps": 9,
                                          "weight": "4+4"
                                    },
                                    {
                                          "reps": 10,
                                          "weight": "4+4"
                                    }
                              ]
                        }
                  ]
            }
      },
      {
            "id": "97qlc1w5a1gqawn00oxhr",
            "type": "focus",
            "startedAt": "2026-02-23T02:55:00.000Z",
            "finishedAt": "2026-02-23T04:25:00.000Z",
            "labels": [
                  "focus",
                  "OrganicLever — data model design"
            ],
            "payload": {
                  "task": "OrganicLever — data model design",
                  "durationMins": 90,
                  "quality": 5,
                  "notes": "Cracked the generic event model idea."
            }
      },
      {
            "id": "9y923dftp3g",
            "type": "workout",
            "startedAt": "2026-02-23T21:52:47.816Z",
            "finishedAt": "2026-02-23T21:52:47.816Z",
            "labels": [
                  "workout",
                  "Calisthenics",
                  "r2",
                  "Future"
            ],
            "payload": {
                  "routineId": "r2",
                  "routineName": "Calisthenics",
                  "durationSecs": 1500,
                  "exercises": [
                        {
                              "exerciseId": "e7",
                              "groupName": "Future",
                              "name": "Leg up",
                              "targetSets": 3,
                              "targetReps": 16,
                              "sets": [
                                    {
                                          "reps": 12
                                    },
                                    {
                                          "reps": 11
                                    },
                                    {
                                          "reps": 12
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e8",
                              "groupName": "Future",
                              "name": "Plank",
                              "targetSets": 3,
                              "type": "duration",
                              "sets": [
                                    {
                                          "duration": 20
                                    },
                                    {
                                          "duration": 22
                                    },
                                    {
                                          "duration": 21
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e9",
                              "groupName": "Future",
                              "name": "Back up",
                              "targetSets": 3,
                              "targetReps": 12,
                              "sets": [
                                    {
                                          "reps": 10
                                    },
                                    {
                                          "reps": 11
                                    },
                                    {
                                          "reps": 10
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e10",
                              "groupName": "Future",
                              "name": "Squat",
                              "targetSets": 3,
                              "targetReps": 9,
                              "sets": [
                                    {
                                          "reps": 8
                                    },
                                    {
                                          "reps": 7
                                    },
                                    {
                                          "reps": 8
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e11",
                              "groupName": "Future",
                              "name": "Push up",
                              "targetSets": 3,
                              "targetReps": 1,
                              "sets": [
                                    {
                                          "reps": 1
                                    },
                                    {
                                          "reps": 1
                                    },
                                    {
                                          "reps": 1
                                    }
                              ]
                        }
                  ]
            }
      },
      {
            "id": "12wtesjowe4i3t55pgpjc",
            "type": "reading",
            "startedAt": "2026-02-24T13:34:00.000Z",
            "finishedAt": "2026-02-24T14:19:00.000Z",
            "labels": [
                  "reading",
                  "Atomic Habits"
            ],
            "payload": {
                  "title": "Atomic Habits",
                  "author": "James Clear",
                  "pages": 32,
                  "durationMins": 45,
                  "completionPct": 10,
                  "notes": null
            }
      },
      {
            "id": "vqnp8t2qp",
            "type": "workout",
            "startedAt": "2026-02-24T21:52:47.816Z",
            "finishedAt": "2026-02-24T21:52:47.816Z",
            "labels": [
                  "workout",
                  "Kettlebell day",
                  "r1",
                  "Kettlebell"
            ],
            "payload": {
                  "routineId": "r1",
                  "routineName": "Kettlebell day",
                  "durationSecs": 2400,
                  "exercises": [
                        {
                              "exerciseId": "e1",
                              "groupName": "Kettlebell",
                              "name": "Low to mid",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "8",
                              "sets": [
                                    {
                                          "reps": 20,
                                          "weight": "8"
                                    },
                                    {
                                          "reps": 19,
                                          "weight": "8"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "8"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e2",
                              "groupName": "Kettlebell",
                              "name": "Mid to up",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "8",
                              "sets": [
                                    {
                                          "reps": 18,
                                          "weight": "8"
                                    },
                                    {
                                          "reps": 19,
                                          "weight": "8"
                                    },
                                    {
                                          "reps": 18,
                                          "weight": "8"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e3",
                              "groupName": "Kettlebell",
                              "name": "Front raise",
                              "targetSets": 3,
                              "targetReps": 12,
                              "targetWeight": "4+4",
                              "sets": [
                                    {
                                          "reps": 12,
                                          "weight": "4+4"
                                    },
                                    {
                                          "reps": 11,
                                          "weight": "4+4"
                                    },
                                    {
                                          "reps": 12,
                                          "weight": "4+4"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e4",
                              "groupName": "Kettlebell",
                              "name": "Tricep",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "6",
                              "sets": [
                                    {
                                          "reps": 20,
                                          "weight": "6"
                                    },
                                    {
                                          "reps": 19,
                                          "weight": "6"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "6"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e5",
                              "groupName": "Kettlebell",
                              "name": "Around the waist",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "10",
                              "sets": [
                                    {
                                          "reps": 20,
                                          "weight": "10"
                                    },
                                    {
                                          "reps": 19,
                                          "weight": "10"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "10"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e6",
                              "groupName": "Kettlebell",
                              "name": "Lateral raise",
                              "targetSets": 3,
                              "targetReps": 11,
                              "targetWeight": "4+4",
                              "sets": [
                                    {
                                          "reps": 11,
                                          "weight": "4+4"
                                    },
                                    {
                                          "reps": 10,
                                          "weight": "4+4"
                                    },
                                    {
                                          "reps": 11,
                                          "weight": "4+4"
                                    }
                              ]
                        }
                  ]
            }
      },
      {
            "id": "gcvm91ncwxs72961x2mok2",
            "type": "learning",
            "startedAt": "2026-02-25T07:16:00.000Z",
            "finishedAt": "2026-02-25T08:01:00.000Z",
            "labels": [
                  "learning",
                  "React hooks deep dive"
            ],
            "payload": {
                  "subject": "React hooks deep dive",
                  "source": "YouTube",
                  "durationMins": 45,
                  "rating": 4,
                  "notes": "Finally understood useCallback properly."
            }
      },
      {
            "id": "iagjlwogoscc24ex0w8e6",
            "type": "meal",
            "startedAt": "2026-02-26T00:39:00.000Z",
            "finishedAt": "2026-02-26T00:39:00.000Z",
            "labels": [
                  "meal",
                  "Breakfast",
                  "Oatmeal with banana & honey"
            ],
            "payload": {
                  "name": "Oatmeal with banana & honey",
                  "mealType": "Breakfast",
                  "energyLevel": 4,
                  "notes": null
            }
      },
      {
            "id": "n0jtavzxgqb1ffceubrob7",
            "type": "meal",
            "startedAt": "2026-02-26T05:40:00.000Z",
            "finishedAt": "2026-02-26T05:40:00.000Z",
            "labels": [
                  "meal",
                  "Lunch",
                  "Nasi goreng ayam"
            ],
            "payload": {
                  "name": "Nasi goreng ayam",
                  "mealType": "Lunch",
                  "energyLevel": 3,
                  "notes": "A bit heavy."
            }
      },
      {
            "id": "l3wv3odtkspyciepec9mwl",
            "type": "focus",
            "startedAt": "2026-02-26T07:03:00.000Z",
            "finishedAt": "2026-02-26T08:03:00.000Z",
            "labels": [
                  "focus",
                  "OrganicLever — HomeScreen redesign"
            ],
            "payload": {
                  "task": "OrganicLever — HomeScreen redesign",
                  "durationMins": 60,
                  "quality": 4,
                  "notes": null
            }
      },
      {
            "id": "nhol1bzj4nosvfy8ojh9zb",
            "type": "reading",
            "startedAt": "2026-02-27T12:30:00.000Z",
            "finishedAt": "2026-02-27T13:10:00.000Z",
            "labels": [
                  "reading",
                  "Atomic Habits"
            ],
            "payload": {
                  "title": "Atomic Habits",
                  "author": "James Clear",
                  "pages": 28,
                  "durationMins": 40,
                  "completionPct": 22,
                  "notes": null
            }
      },
      {
            "id": "cbryrragbm2u426m2f467",
            "type": "meal",
            "startedAt": "2026-02-27T12:54:00.000Z",
            "finishedAt": "2026-02-27T12:54:00.000Z",
            "labels": [
                  "meal",
                  "Dinner",
                  "Green salad + grilled chicken"
            ],
            "payload": {
                  "name": "Green salad + grilled chicken",
                  "mealType": "Dinner",
                  "energyLevel": 4,
                  "notes": null
            }
      },
      {
            "id": "3j2mqz9vk55",
            "type": "workout",
            "startedAt": "2026-02-27T21:52:47.816Z",
            "finishedAt": "2026-02-27T21:52:47.816Z",
            "labels": [
                  "workout",
                  "Kettlebell day",
                  "r1",
                  "Kettlebell"
            ],
            "payload": {
                  "routineId": "r1",
                  "routineName": "Kettlebell day",
                  "durationSecs": 2520,
                  "exercises": [
                        {
                              "exerciseId": "e1",
                              "groupName": "Kettlebell",
                              "name": "Low to mid",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "8",
                              "sets": [
                                    {
                                          "reps": 20,
                                          "weight": "8"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "8"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "8"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e2",
                              "groupName": "Kettlebell",
                              "name": "Mid to up",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "8",
                              "sets": [
                                    {
                                          "reps": 20,
                                          "weight": "8"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "8"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "8"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e3",
                              "groupName": "Kettlebell",
                              "name": "Front raise",
                              "targetSets": 3,
                              "targetReps": 12,
                              "targetWeight": "4+4",
                              "sets": [
                                    {
                                          "reps": 12,
                                          "weight": "4+4"
                                    },
                                    {
                                          "reps": 12,
                                          "weight": "4+4"
                                    },
                                    {
                                          "reps": 11,
                                          "weight": "4+4"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e4",
                              "groupName": "Kettlebell",
                              "name": "Tricep",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "8",
                              "sets": [
                                    {
                                          "reps": 18,
                                          "weight": "8"
                                    },
                                    {
                                          "reps": 17,
                                          "weight": "8"
                                    },
                                    {
                                          "reps": 18,
                                          "weight": "8"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e5",
                              "groupName": "Kettlebell",
                              "name": "Around the waist",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "10",
                              "sets": [
                                    {
                                          "reps": 20,
                                          "weight": "10"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "10"
                                    },
                                    {
                                          "reps": 19,
                                          "weight": "10"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e6",
                              "groupName": "Kettlebell",
                              "name": "Lateral raise",
                              "targetSets": 3,
                              "targetReps": 11,
                              "targetWeight": "4+4",
                              "sets": [
                                    {
                                          "reps": 11,
                                          "weight": "4+4"
                                    },
                                    {
                                          "reps": 11,
                                          "weight": "4+4"
                                    },
                                    {
                                          "reps": 10,
                                          "weight": "4+4"
                                    }
                              ]
                        }
                  ]
            }
      },
      {
            "id": "k9mqpjlx0kl3290xnv63a7",
            "type": "meal",
            "startedAt": "2026-02-28T00:42:00.000Z",
            "finishedAt": "2026-02-28T00:42:00.000Z",
            "labels": [
                  "meal",
                  "Breakfast",
                  "Black coffee + banana"
            ],
            "payload": {
                  "name": "Black coffee + banana",
                  "mealType": "Breakfast",
                  "energyLevel": 5,
                  "notes": null
            }
      },
      {
            "id": "93hh2pxid5sfp97fry3fh",
            "type": "focus",
            "startedAt": "2026-02-28T02:51:00.000Z",
            "finishedAt": "2026-02-28T03:36:00.000Z",
            "labels": [
                  "focus",
                  "Weekly review & planning"
            ],
            "payload": {
                  "task": "Weekly review & planning",
                  "durationMins": 45,
                  "quality": 4,
                  "notes": "Set clear goals for next week."
            }
      },
      {
            "id": "wyn9du4g2uz9xwjbaudp",
            "type": "meal",
            "startedAt": "2026-03-01T05:05:00.000Z",
            "finishedAt": "2026-03-01T05:05:00.000Z",
            "labels": [
                  "meal",
                  "Lunch",
                  "Gado-gado"
            ],
            "payload": {
                  "name": "Gado-gado",
                  "mealType": "Lunch",
                  "energyLevel": 4,
                  "notes": null
            }
      },
      {
            "id": "np679p27fls1yylrhqezc5",
            "type": "learning",
            "startedAt": "2026-03-01T08:39:00.000Z",
            "finishedAt": "2026-03-01T09:39:00.000Z",
            "labels": [
                  "learning",
                  "TypeScript generics"
            ],
            "payload": {
                  "subject": "TypeScript generics",
                  "source": "Official docs",
                  "durationMins": 60,
                  "rating": 3,
                  "notes": null
            }
      },
      {
            "id": "068qsbn1wpkqhz431jttpsh",
            "type": "meal",
            "startedAt": "2026-03-01T12:47:00.000Z",
            "finishedAt": "2026-03-01T12:47:00.000Z",
            "labels": [
                  "meal",
                  "Dinner",
                  "Tempe & tofu stir-fry"
            ],
            "payload": {
                  "name": "Tempe & tofu stir-fry",
                  "mealType": "Dinner",
                  "energyLevel": 4,
                  "notes": null
            }
      },
      {
            "id": "x8cc56fy3ac",
            "type": "workout",
            "startedAt": "2026-03-01T21:52:47.816Z",
            "finishedAt": "2026-03-01T21:52:47.816Z",
            "labels": [
                  "workout",
                  "Super Exercise",
                  "r3",
                  "Circuit A",
                  "Circuit B"
            ],
            "payload": {
                  "routineId": "r3",
                  "routineName": "Super Exercise",
                  "durationSecs": 3300,
                  "exercises": [
                        {
                              "exerciseId": "s1",
                              "groupName": "Circuit A",
                              "name": "Deadlift",
                              "targetSets": 4,
                              "targetReps": 5,
                              "sets": [
                                    {
                                          "reps": 5,
                                          "weight": "60"
                                    },
                                    {
                                          "reps": 5,
                                          "weight": "60"
                                    },
                                    {
                                          "reps": 5,
                                          "weight": "60"
                                    },
                                    {
                                          "reps": 4,
                                          "weight": "60"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "s2",
                              "groupName": "Circuit A",
                              "name": "Bench press",
                              "targetSets": 4,
                              "targetReps": 8,
                              "sets": [
                                    {
                                          "reps": 8,
                                          "weight": "40"
                                    },
                                    {
                                          "reps": 7,
                                          "weight": "40"
                                    },
                                    {
                                          "reps": 7,
                                          "weight": "40"
                                    },
                                    {
                                          "reps": 6,
                                          "weight": "40"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "s3",
                              "groupName": "Circuit B",
                              "name": "Overhead press",
                              "targetSets": 3,
                              "targetReps": 8,
                              "sets": [
                                    {
                                          "reps": 8,
                                          "weight": "20"
                                    },
                                    {
                                          "reps": 7,
                                          "weight": "20"
                                    },
                                    {
                                          "reps": 7,
                                          "weight": "20"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "s7",
                              "groupName": "Circuit B",
                              "name": "Dead bug",
                              "targetSets": 3,
                              "targetReps": 10,
                              "sets": [
                                    {
                                          "reps": 10
                                    },
                                    {
                                          "reps": 9
                                    },
                                    {
                                          "reps": 10
                                    }
                              ]
                        }
                  ]
            }
      },
      {
            "id": "48iljtqe8jk4nh2cb3kyi",
            "type": "meal",
            "startedAt": "2026-03-02T00:19:00.000Z",
            "finishedAt": "2026-03-02T00:19:00.000Z",
            "labels": [
                  "meal",
                  "Breakfast",
                  "Smoothie — spinach, mango, protein"
            ],
            "payload": {
                  "name": "Smoothie — spinach, mango, protein",
                  "mealType": "Breakfast",
                  "energyLevel": 5,
                  "notes": "Best pre-workout fuel."
            }
      },
      {
            "id": "4gx128rj51q8i7w0to57lm",
            "type": "reading",
            "startedAt": "2026-03-02T13:49:00.000Z",
            "finishedAt": "2026-03-02T14:39:00.000Z",
            "labels": [
                  "reading",
                  "Atomic Habits"
            ],
            "payload": {
                  "title": "Atomic Habits",
                  "author": "James Clear",
                  "pages": 35,
                  "durationMins": 50,
                  "completionPct": 35,
                  "notes": null
            }
      },
      {
            "id": "6smal3ddwnk468b6h0d509",
            "type": "focus",
            "startedAt": "2026-03-03T03:16:00.000Z",
            "finishedAt": "2026-03-03T05:16:00.000Z",
            "labels": [
                  "focus",
                  "Tax return preparation"
            ],
            "payload": {
                  "task": "Tax return preparation",
                  "durationMins": 120,
                  "quality": 2,
                  "notes": "Painful but done."
            }
      },
      {
            "id": "wih6ltilsfk6hn0kejuaul",
            "type": "meal",
            "startedAt": "2026-03-03T05:28:00.000Z",
            "finishedAt": "2026-03-03T05:28:00.000Z",
            "labels": [
                  "meal",
                  "Lunch",
                  "Ayam bakar + rice"
            ],
            "payload": {
                  "name": "Ayam bakar + rice",
                  "mealType": "Lunch",
                  "energyLevel": 3,
                  "notes": null
            }
      },
      {
            "id": "dvv4evzko597k60jx95gqv",
            "type": "meal",
            "startedAt": "2026-03-03T12:19:00.000Z",
            "finishedAt": "2026-03-03T12:19:00.000Z",
            "labels": [
                  "meal",
                  "Dinner",
                  "Salmon + steamed vegetables"
            ],
            "payload": {
                  "name": "Salmon + steamed vegetables",
                  "mealType": "Dinner",
                  "energyLevel": 5,
                  "notes": "Felt great. Will repeat."
            }
      },
      {
            "id": "o5ifvfkvql",
            "type": "workout",
            "startedAt": "2026-03-03T21:52:47.816Z",
            "finishedAt": "2026-03-03T21:52:47.816Z",
            "labels": [
                  "workout",
                  "Kettlebell day",
                  "r1",
                  "Kettlebell"
            ],
            "payload": {
                  "routineId": "r1",
                  "routineName": "Kettlebell day",
                  "durationSecs": 2340,
                  "exercises": [
                        {
                              "exerciseId": "e1",
                              "groupName": "Kettlebell",
                              "name": "Low to mid",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "10",
                              "sets": [
                                    {
                                          "reps": 16,
                                          "weight": "10"
                                    },
                                    {
                                          "reps": 15,
                                          "weight": "10"
                                    },
                                    {
                                          "reps": 14,
                                          "weight": "10"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e2",
                              "groupName": "Kettlebell",
                              "name": "Mid to up",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "10",
                              "sets": [
                                    {
                                          "reps": 15,
                                          "weight": "10"
                                    },
                                    {
                                          "reps": 14,
                                          "weight": "10"
                                    },
                                    {
                                          "reps": 14,
                                          "weight": "10"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e3",
                              "groupName": "Kettlebell",
                              "name": "Front raise",
                              "targetSets": 3,
                              "targetReps": 12,
                              "targetWeight": "6",
                              "sets": [
                                    {
                                          "reps": 10,
                                          "weight": "6"
                                    },
                                    {
                                          "reps": 9,
                                          "weight": "6"
                                    },
                                    {
                                          "reps": 9,
                                          "weight": "6"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e4",
                              "groupName": "Kettlebell",
                              "name": "Tricep",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "8",
                              "sets": [
                                    {
                                          "reps": 20,
                                          "weight": "8"
                                    },
                                    {
                                          "reps": 19,
                                          "weight": "8"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "8"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e5",
                              "groupName": "Kettlebell",
                              "name": "Around the waist",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "12",
                              "sets": [
                                    {
                                          "reps": 16,
                                          "weight": "12"
                                    },
                                    {
                                          "reps": 15,
                                          "weight": "12"
                                    },
                                    {
                                          "reps": 16,
                                          "weight": "12"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e6",
                              "groupName": "Kettlebell",
                              "name": "Lateral raise",
                              "targetSets": 3,
                              "targetReps": 11,
                              "targetWeight": "6",
                              "sets": [
                                    {
                                          "reps": 9,
                                          "weight": "6"
                                    },
                                    {
                                          "reps": 8,
                                          "weight": "6"
                                    },
                                    {
                                          "reps": 9,
                                          "weight": "6"
                                    }
                              ]
                        }
                  ]
            }
      },
      {
            "id": "6ke1hzdpkuotthx6ztmtlh",
            "type": "meal",
            "startedAt": "2026-03-04T00:04:00.000Z",
            "finishedAt": "2026-03-04T00:04:00.000Z",
            "labels": [
                  "meal",
                  "Breakfast",
                  "Eggs + toast + avocado"
            ],
            "payload": {
                  "name": "Eggs + toast + avocado",
                  "mealType": "Breakfast",
                  "energyLevel": 4,
                  "notes": null
            }
      },
      {
            "id": "cu90jq48nu79q2qolxgwr8",
            "type": "learning",
            "startedAt": "2026-03-04T07:13:00.000Z",
            "finishedAt": "2026-03-04T08:43:00.000Z",
            "labels": [
                  "learning",
                  "PostgreSQL window functions"
            ],
            "payload": {
                  "subject": "PostgreSQL window functions",
                  "source": "Book",
                  "durationMins": 90,
                  "rating": 5,
                  "notes": "Mind blown by PARTITION BY."
            }
      },
      {
            "id": "ui2k7vevgygooc77yegsi",
            "type": "meal",
            "startedAt": "2026-03-05T05:21:00.000Z",
            "finishedAt": "2026-03-05T05:21:00.000Z",
            "labels": [
                  "meal",
                  "Lunch",
                  "Soto ayam"
            ],
            "payload": {
                  "name": "Soto ayam",
                  "mealType": "Lunch",
                  "energyLevel": 4,
                  "notes": null
            }
      },
      {
            "id": "s7e319fpe5zkpl45by2kb",
            "type": "reading",
            "startedAt": "2026-03-05T14:58:00.000Z",
            "finishedAt": "2026-03-05T15:53:00.000Z",
            "labels": [
                  "reading",
                  "Atomic Habits"
            ],
            "payload": {
                  "title": "Atomic Habits",
                  "author": "James Clear",
                  "pages": 40,
                  "durationMins": 55,
                  "completionPct": 50,
                  "notes": null
            }
      },
      {
            "id": "8q229f0kb9t6v5opmqgau",
            "type": "focus",
            "startedAt": "2026-03-06T08:22:00.000Z",
            "finishedAt": "2026-03-06T09:52:00.000Z",
            "labels": [
                  "focus",
                  "Deep reading — DDD book"
            ],
            "payload": {
                  "task": "Deep reading — DDD book",
                  "durationMins": 90,
                  "quality": 5,
                  "notes": null
            }
      },
      {
            "id": "ypp3ghwiwb92mwzfpjibxo",
            "type": "meal",
            "startedAt": "2026-03-06T09:24:00.000Z",
            "finishedAt": "2026-03-06T09:24:00.000Z",
            "labels": [
                  "meal",
                  "Snack",
                  "Martabak manis"
            ],
            "payload": {
                  "name": "Martabak manis",
                  "mealType": "Snack",
                  "energyLevel": 2,
                  "notes": "Delicious but not ideal before sleep."
            }
      },
      {
            "id": "snp5tfmxnpa11caa40n86bh",
            "type": "meal",
            "startedAt": "2026-03-07T00:35:00.000Z",
            "finishedAt": "2026-03-07T00:35:00.000Z",
            "labels": [
                  "meal",
                  "Breakfast",
                  "Overnight oats + berries"
            ],
            "payload": {
                  "name": "Overnight oats + berries",
                  "mealType": "Breakfast",
                  "energyLevel": 5,
                  "notes": null
            }
      },
      {
            "id": "ej5jk05cd0fpynvw3e0srm",
            "type": "learning",
            "startedAt": "2026-03-07T09:58:00.000Z",
            "finishedAt": "2026-03-07T10:38:00.000Z",
            "labels": [
                  "learning",
                  "System design: load balancing"
            ],
            "payload": {
                  "subject": "System design: load balancing",
                  "source": "Blog",
                  "durationMins": 40,
                  "rating": 4,
                  "notes": null
            }
      },
      {
            "id": "3bpb9xhya4p",
            "type": "workout",
            "startedAt": "2026-03-07T21:52:47.816Z",
            "finishedAt": "2026-03-07T21:52:47.816Z",
            "labels": [
                  "workout",
                  "Kettlebell day",
                  "r1",
                  "Kettlebell"
            ],
            "payload": {
                  "routineId": "r1",
                  "routineName": "Kettlebell day",
                  "durationSecs": 2460,
                  "exercises": [
                        {
                              "exerciseId": "e1",
                              "groupName": "Kettlebell",
                              "name": "Low to mid",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "10",
                              "sets": [
                                    {
                                          "reps": 18,
                                          "weight": "10"
                                    },
                                    {
                                          "reps": 17,
                                          "weight": "10"
                                    },
                                    {
                                          "reps": 18,
                                          "weight": "10"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e2",
                              "groupName": "Kettlebell",
                              "name": "Mid to up",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "10",
                              "sets": [
                                    {
                                          "reps": 17,
                                          "weight": "10"
                                    },
                                    {
                                          "reps": 17,
                                          "weight": "10"
                                    },
                                    {
                                          "reps": 16,
                                          "weight": "10"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e3",
                              "groupName": "Kettlebell",
                              "name": "Front raise",
                              "targetSets": 3,
                              "targetReps": 12,
                              "targetWeight": "6",
                              "sets": [
                                    {
                                          "reps": 12,
                                          "weight": "6"
                                    },
                                    {
                                          "reps": 11,
                                          "weight": "6"
                                    },
                                    {
                                          "reps": 12,
                                          "weight": "6"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e4",
                              "groupName": "Kettlebell",
                              "name": "Tricep",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "8",
                              "sets": [
                                    {
                                          "reps": 20,
                                          "weight": "8"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "8"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "8"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e5",
                              "groupName": "Kettlebell",
                              "name": "Around the waist",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "12",
                              "sets": [
                                    {
                                          "reps": 18,
                                          "weight": "12"
                                    },
                                    {
                                          "reps": 18,
                                          "weight": "12"
                                    },
                                    {
                                          "reps": 18,
                                          "weight": "12"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e6",
                              "groupName": "Kettlebell",
                              "name": "Lateral raise",
                              "targetSets": 3,
                              "targetReps": 11,
                              "targetWeight": "6",
                              "sets": [
                                    {
                                          "reps": 11,
                                          "weight": "6"
                                    },
                                    {
                                          "reps": 10,
                                          "weight": "6"
                                    },
                                    {
                                          "reps": 11,
                                          "weight": "6"
                                    }
                              ]
                        }
                  ]
            }
      },
      {
            "id": "eemwl2lvkx8ogpyqiyiyg",
            "type": "meal",
            "startedAt": "2026-03-08T12:17:00.000Z",
            "finishedAt": "2026-03-08T12:17:00.000Z",
            "labels": [
                  "meal",
                  "Dinner",
                  "Rendang + white rice"
            ],
            "payload": {
                  "name": "Rendang + white rice",
                  "mealType": "Dinner",
                  "energyLevel": 3,
                  "notes": null
            }
      },
      {
            "id": "h2mh0jexpj49gbjl7hub5",
            "type": "reading",
            "startedAt": "2026-03-08T13:28:00.000Z",
            "finishedAt": "2026-03-08T14:10:00.000Z",
            "labels": [
                  "reading",
                  "Atomic Habits"
            ],
            "payload": {
                  "title": "Atomic Habits",
                  "author": "James Clear",
                  "pages": 30,
                  "durationMins": 42,
                  "completionPct": 65,
                  "notes": null
            }
      },
      {
            "id": "c5076jvx49edctos2q418t",
            "type": "meal",
            "startedAt": "2026-03-09T00:34:00.000Z",
            "finishedAt": "2026-03-09T00:34:00.000Z",
            "labels": [
                  "meal",
                  "Snack",
                  "Protein shake + almonds"
            ],
            "payload": {
                  "name": "Protein shake + almonds",
                  "mealType": "Snack",
                  "energyLevel": 4,
                  "notes": null
            }
      },
      {
            "id": "too1qgeqsnp9f7nxmfbib",
            "type": "focus",
            "startedAt": "2026-03-09T02:25:00.000Z",
            "finishedAt": "2026-03-09T03:40:00.000Z",
            "labels": [
                  "focus",
                  "OrganicLever — ProgressScreen"
            ],
            "payload": {
                  "task": "OrganicLever — ProgressScreen",
                  "durationMins": 75,
                  "quality": 4,
                  "notes": null
            }
      },
      {
            "id": "y86i6r8mo0e",
            "type": "workout",
            "startedAt": "2026-03-09T21:52:47.816Z",
            "finishedAt": "2026-03-09T21:52:47.816Z",
            "labels": [
                  "workout",
                  "Calisthenics",
                  "r2",
                  "Future"
            ],
            "payload": {
                  "routineId": "r2",
                  "routineName": "Calisthenics",
                  "durationSecs": 1620,
                  "exercises": [
                        {
                              "exerciseId": "e7",
                              "groupName": "Future",
                              "name": "Leg up",
                              "targetSets": 3,
                              "targetReps": 16,
                              "sets": [
                                    {
                                          "reps": 14
                                    },
                                    {
                                          "reps": 13
                                    },
                                    {
                                          "reps": 14
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e8",
                              "groupName": "Future",
                              "name": "Plank",
                              "targetSets": 3,
                              "type": "duration",
                              "sets": [
                                    {
                                          "duration": 25
                                    },
                                    {
                                          "duration": 24
                                    },
                                    {
                                          "duration": 25
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e9",
                              "groupName": "Future",
                              "name": "Back up",
                              "targetSets": 3,
                              "targetReps": 12,
                              "sets": [
                                    {
                                          "reps": 12
                                    },
                                    {
                                          "reps": 11
                                    },
                                    {
                                          "reps": 12
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e10",
                              "groupName": "Future",
                              "name": "Squat",
                              "targetSets": 3,
                              "targetReps": 9,
                              "sets": [
                                    {
                                          "reps": 9
                                    },
                                    {
                                          "reps": 8
                                    },
                                    {
                                          "reps": 9
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e11",
                              "groupName": "Future",
                              "name": "Push up",
                              "targetSets": 3,
                              "targetReps": 1,
                              "sets": [
                                    {
                                          "reps": 2
                                    },
                                    {
                                          "reps": 2
                                    },
                                    {
                                          "reps": 1
                                    }
                              ]
                        }
                  ]
            }
      },
      {
            "id": "5s44tu4kq8smnjj9uqnfd",
            "type": "meal",
            "startedAt": "2026-03-10T05:21:00.000Z",
            "finishedAt": "2026-03-10T05:21:00.000Z",
            "labels": [
                  "meal",
                  "Lunch",
                  "Mie ayam"
            ],
            "payload": {
                  "name": "Mie ayam",
                  "mealType": "Lunch",
                  "energyLevel": 3,
                  "notes": null
            }
      },
      {
            "id": "gx4xfk2sa3hufbxquo8wk",
            "type": "learning",
            "startedAt": "2026-03-10T07:24:00.000Z",
            "finishedAt": "2026-03-10T08:39:00.000Z",
            "labels": [
                  "learning",
                  "DDD — Domain Events"
            ],
            "payload": {
                  "subject": "DDD — Domain Events",
                  "source": "Book",
                  "durationMins": 75,
                  "rating": 5,
                  "notes": "Literally what we are building in OrganicLever."
            }
      },
      {
            "id": "cubsiiytedk6wsznay5gk",
            "type": "reading",
            "startedAt": "2026-03-11T12:00:00.000Z",
            "finishedAt": "2026-03-11T13:00:00.000Z",
            "labels": [
                  "reading",
                  "Atomic Habits"
            ],
            "payload": {
                  "title": "Atomic Habits",
                  "author": "James Clear",
                  "pages": 45,
                  "durationMins": 60,
                  "completionPct": 80,
                  "notes": null
            }
      },
      {
            "id": "ojxehr08oao7t6hg669qw",
            "type": "meal",
            "startedAt": "2026-03-11T12:22:00.000Z",
            "finishedAt": "2026-03-11T12:22:00.000Z",
            "labels": [
                  "meal",
                  "Dinner",
                  "Ikan bakar + lalap"
            ],
            "payload": {
                  "name": "Ikan bakar + lalap",
                  "mealType": "Dinner",
                  "energyLevel": 5,
                  "notes": "Light, fresh, energizing."
            }
      },
      {
            "id": "6ciedc8a7zh",
            "type": "workout",
            "startedAt": "2026-03-11T21:52:47.816Z",
            "finishedAt": "2026-03-11T21:52:47.816Z",
            "labels": [
                  "workout",
                  "Kettlebell day",
                  "r1",
                  "Kettlebell"
            ],
            "payload": {
                  "routineId": "r1",
                  "routineName": "Kettlebell day",
                  "durationSecs": 2520,
                  "exercises": [
                        {
                              "exerciseId": "e1",
                              "groupName": "Kettlebell",
                              "name": "Low to mid",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "10",
                              "sets": [
                                    {
                                          "reps": 20,
                                          "weight": "10"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "10"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "10"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e2",
                              "groupName": "Kettlebell",
                              "name": "Mid to up",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "10",
                              "sets": [
                                    {
                                          "reps": 19,
                                          "weight": "10"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "10"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "10"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e3",
                              "groupName": "Kettlebell",
                              "name": "Front raise",
                              "targetSets": 3,
                              "targetReps": 12,
                              "targetWeight": "6",
                              "sets": [
                                    {
                                          "reps": 12,
                                          "weight": "6"
                                    },
                                    {
                                          "reps": 12,
                                          "weight": "6"
                                    },
                                    {
                                          "reps": 12,
                                          "weight": "6"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e4",
                              "groupName": "Kettlebell",
                              "name": "Tricep",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "10",
                              "sets": [
                                    {
                                          "reps": 16,
                                          "weight": "10"
                                    },
                                    {
                                          "reps": 15,
                                          "weight": "10"
                                    },
                                    {
                                          "reps": 16,
                                          "weight": "10"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e5",
                              "groupName": "Kettlebell",
                              "name": "Around the waist",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "12",
                              "sets": [
                                    {
                                          "reps": 20,
                                          "weight": "12"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "12"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "12"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e6",
                              "groupName": "Kettlebell",
                              "name": "Lateral raise",
                              "targetSets": 3,
                              "targetReps": 11,
                              "targetWeight": "6",
                              "sets": [
                                    {
                                          "reps": 11,
                                          "weight": "6"
                                    },
                                    {
                                          "reps": 11,
                                          "weight": "6"
                                    },
                                    {
                                          "reps": 11,
                                          "weight": "6"
                                    }
                              ]
                        }
                  ]
            }
      },
      {
            "id": "91ocrs4ewojij1ipj4ej5",
            "type": "meal",
            "startedAt": "2026-03-12T00:51:00.000Z",
            "finishedAt": "2026-03-12T00:51:00.000Z",
            "labels": [
                  "meal",
                  "Breakfast",
                  "Granola + yoghurt + fruit"
            ],
            "payload": {
                  "name": "Granola + yoghurt + fruit",
                  "mealType": "Breakfast",
                  "energyLevel": 4,
                  "notes": null
            }
      },
      {
            "id": "qab0f7pmvtfx1wi1amlpu",
            "type": "focus",
            "startedAt": "2026-03-12T03:31:00.000Z",
            "finishedAt": "2026-03-12T04:01:00.000Z",
            "labels": [
                  "focus",
                  "Email inbox zero"
            ],
            "payload": {
                  "task": "Email inbox zero",
                  "durationMins": 30,
                  "quality": 3,
                  "notes": null
            }
      },
      {
            "id": "qcupc76uolm6aijqi9oo5h",
            "type": "learning",
            "startedAt": "2026-03-13T08:53:00.000Z",
            "finishedAt": "2026-03-13T09:23:00.000Z",
            "labels": [
                  "learning",
                  "CSS container queries"
            ],
            "payload": {
                  "subject": "CSS container queries",
                  "source": "MDN",
                  "durationMins": 30,
                  "rating": 3,
                  "notes": null
            }
      },
      {
            "id": "u3l1uuqz6g",
            "type": "workout",
            "startedAt": "2026-03-13T21:52:47.816Z",
            "finishedAt": "2026-03-13T21:52:47.816Z",
            "labels": [
                  "workout",
                  "Super Exercise",
                  "r3",
                  "Circuit A",
                  "Circuit B"
            ],
            "payload": {
                  "routineId": "r3",
                  "routineName": "Super Exercise",
                  "durationSecs": 3480,
                  "exercises": [
                        {
                              "exerciseId": "s1",
                              "groupName": "Circuit A",
                              "name": "Deadlift",
                              "targetSets": 4,
                              "targetReps": 5,
                              "sets": [
                                    {
                                          "reps": 5,
                                          "weight": "70"
                                    },
                                    {
                                          "reps": 5,
                                          "weight": "70"
                                    },
                                    {
                                          "reps": 5,
                                          "weight": "70"
                                    },
                                    {
                                          "reps": 5,
                                          "weight": "70"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "s2",
                              "groupName": "Circuit A",
                              "name": "Bench press",
                              "targetSets": 4,
                              "targetReps": 8,
                              "sets": [
                                    {
                                          "reps": 8,
                                          "weight": "40"
                                    },
                                    {
                                          "reps": 8,
                                          "weight": "40"
                                    },
                                    {
                                          "reps": 8,
                                          "weight": "40"
                                    },
                                    {
                                          "reps": 7,
                                          "weight": "40"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "s3",
                              "groupName": "Circuit B",
                              "name": "Overhead press",
                              "targetSets": 3,
                              "targetReps": 8,
                              "sets": [
                                    {
                                          "reps": 8,
                                          "weight": "22"
                                    },
                                    {
                                          "reps": 8,
                                          "weight": "22"
                                    },
                                    {
                                          "reps": 7,
                                          "weight": "22"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "s7",
                              "groupName": "Circuit B",
                              "name": "Dead bug",
                              "targetSets": 3,
                              "targetReps": 10,
                              "sets": [
                                    {
                                          "reps": 10
                                    },
                                    {
                                          "reps": 10
                                    },
                                    {
                                          "reps": 10
                                    }
                              ]
                        }
                  ]
            }
      },
      {
            "id": "3kv41xrlstm4cihl8dvo",
            "type": "reading",
            "startedAt": "2026-03-14T14:12:00.000Z",
            "finishedAt": "2026-03-14T15:04:00.000Z",
            "labels": [
                  "reading",
                  "Atomic Habits"
            ],
            "payload": {
                  "title": "Atomic Habits",
                  "author": "James Clear",
                  "pages": 38,
                  "durationMins": 52,
                  "completionPct": 100,
                  "notes": "Finished! Key insight: habits are compound interest."
            }
      },
      {
            "id": "0kmmba40rskadibc8elfl9t",
            "type": "focus",
            "startedAt": "2026-03-15T02:44:00.000Z",
            "finishedAt": "2026-03-15T04:14:00.000Z",
            "labels": [
                  "focus",
                  "OrganicLever — event logger design"
            ],
            "payload": {
                  "task": "OrganicLever — event logger design",
                  "durationMins": 90,
                  "quality": 5,
                  "notes": null
            }
      },
      {
            "id": "i8xzhb8q59knetgjw3dds",
            "type": "learning",
            "startedAt": "2026-03-16T07:07:00.000Z",
            "finishedAt": "2026-03-16T07:27:00.000Z",
            "labels": [
                  "learning",
                  "Spanish vocabulary — family"
            ],
            "payload": {
                  "subject": "Spanish vocabulary — family",
                  "source": "Practice",
                  "durationMins": 20,
                  "rating": 4,
                  "notes": null
            }
      },
      {
            "id": "ofned61pjnf",
            "type": "workout",
            "startedAt": "2026-03-16T21:52:47.816Z",
            "finishedAt": "2026-03-16T21:52:47.816Z",
            "labels": [
                  "workout",
                  "Kettlebell day",
                  "r1",
                  "Kettlebell"
            ],
            "payload": {
                  "routineId": "r1",
                  "routineName": "Kettlebell day",
                  "durationSecs": 2580,
                  "exercises": [
                        {
                              "exerciseId": "e1",
                              "groupName": "Kettlebell",
                              "name": "Low to mid",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "12",
                              "sets": [
                                    {
                                          "reps": 15,
                                          "weight": "12"
                                    },
                                    {
                                          "reps": 14,
                                          "weight": "12"
                                    },
                                    {
                                          "reps": 14,
                                          "weight": "12"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e2",
                              "groupName": "Kettlebell",
                              "name": "Mid to up",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "12",
                              "sets": [
                                    {
                                          "reps": 14,
                                          "weight": "12"
                                    },
                                    {
                                          "reps": 13,
                                          "weight": "12"
                                    },
                                    {
                                          "reps": 14,
                                          "weight": "12"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e3",
                              "groupName": "Kettlebell",
                              "name": "Front raise",
                              "targetSets": 3,
                              "targetReps": 12,
                              "targetWeight": "6",
                              "sets": [
                                    {
                                          "reps": 12,
                                          "weight": "6"
                                    },
                                    {
                                          "reps": 12,
                                          "weight": "6"
                                    },
                                    {
                                          "reps": 12,
                                          "weight": "6"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e4",
                              "groupName": "Kettlebell",
                              "name": "Tricep",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "10",
                              "sets": [
                                    {
                                          "reps": 18,
                                          "weight": "10"
                                    },
                                    {
                                          "reps": 18,
                                          "weight": "10"
                                    },
                                    {
                                          "reps": 17,
                                          "weight": "10"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e5",
                              "groupName": "Kettlebell",
                              "name": "Around the waist",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "12",
                              "sets": [
                                    {
                                          "reps": 20,
                                          "weight": "12"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "12"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "12"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e6",
                              "groupName": "Kettlebell",
                              "name": "Lateral raise",
                              "targetSets": 3,
                              "targetReps": 11,
                              "targetWeight": "6",
                              "sets": [
                                    {
                                          "reps": 11,
                                          "weight": "6"
                                    },
                                    {
                                          "reps": 11,
                                          "weight": "6"
                                    },
                                    {
                                          "reps": 11,
                                          "weight": "6"
                                    }
                              ]
                        }
                  ]
            }
      },
      {
            "id": "avj6e0nqlebtmhp8eu8w09",
            "type": "reading",
            "startedAt": "2026-03-17T13:02:00.000Z",
            "finishedAt": "2026-03-17T13:37:00.000Z",
            "labels": [
                  "reading",
                  "Deep Work"
            ],
            "payload": {
                  "title": "Deep Work",
                  "author": "Cal Newport",
                  "pages": 25,
                  "durationMins": 35,
                  "completionPct": 10,
                  "notes": null
            }
      },
      {
            "id": "bi8q8zi0uemyk0b1wfgm7",
            "type": "focus",
            "startedAt": "2026-03-18T08:06:00.000Z",
            "finishedAt": "2026-03-18T09:06:00.000Z",
            "labels": [
                  "focus",
                  "Writing — product vision doc"
            ],
            "payload": {
                  "task": "Writing — product vision doc",
                  "durationMins": 60,
                  "quality": 4,
                  "notes": "Good flow session."
            }
      },
      {
            "id": "tcveslx81hcmjeedv0oo0b",
            "type": "learning",
            "startedAt": "2026-03-19T09:52:00.000Z",
            "finishedAt": "2026-03-19T10:12:00.000Z",
            "labels": [
                  "learning",
                  "Spanish vocabulary — food"
            ],
            "payload": {
                  "subject": "Spanish vocabulary — food",
                  "source": "Practice",
                  "durationMins": 20,
                  "rating": 3,
                  "notes": null
            }
      },
      {
            "id": "wgq3w3qv9cc3lu8zx89h5",
            "type": "reading",
            "startedAt": "2026-03-20T13:08:00.000Z",
            "finishedAt": "2026-03-20T14:06:00.000Z",
            "labels": [
                  "reading",
                  "Deep Work"
            ],
            "payload": {
                  "title": "Deep Work",
                  "author": "Cal Newport",
                  "pages": 42,
                  "durationMins": 58,
                  "completionPct": 28,
                  "notes": null
            }
      },
      {
            "id": "0m7hdsnf52o31l1am2maiy",
            "type": "focus",
            "startedAt": "2026-03-21T03:22:00.000Z",
            "finishedAt": "2026-03-21T04:07:00.000Z",
            "labels": [
                  "focus",
                  "Code review — team PRs"
            ],
            "payload": {
                  "task": "Code review — team PRs",
                  "durationMins": 45,
                  "quality": 3,
                  "notes": null
            }
      },
      {
            "id": "r0rmyzftawo",
            "type": "workout",
            "startedAt": "2026-03-21T21:52:47.816Z",
            "finishedAt": "2026-03-21T21:52:47.816Z",
            "labels": [
                  "workout",
                  "Kettlebell day",
                  "r1",
                  "Kettlebell"
            ],
            "payload": {
                  "routineId": "r1",
                  "routineName": "Kettlebell day",
                  "durationSecs": 2640,
                  "exercises": [
                        {
                              "exerciseId": "e1",
                              "groupName": "Kettlebell",
                              "name": "Low to mid",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "12",
                              "sets": [
                                    {
                                          "reps": 18,
                                          "weight": "12"
                                    },
                                    {
                                          "reps": 17,
                                          "weight": "12"
                                    },
                                    {
                                          "reps": 18,
                                          "weight": "12"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e2",
                              "groupName": "Kettlebell",
                              "name": "Mid to up",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "12",
                              "sets": [
                                    {
                                          "reps": 16,
                                          "weight": "12"
                                    },
                                    {
                                          "reps": 17,
                                          "weight": "12"
                                    },
                                    {
                                          "reps": 16,
                                          "weight": "12"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e3",
                              "groupName": "Kettlebell",
                              "name": "Front raise",
                              "targetSets": 3,
                              "targetReps": 12,
                              "targetWeight": "8",
                              "sets": [
                                    {
                                          "reps": 10,
                                          "weight": "8"
                                    },
                                    {
                                          "reps": 9,
                                          "weight": "8"
                                    },
                                    {
                                          "reps": 9,
                                          "weight": "8"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e4",
                              "groupName": "Kettlebell",
                              "name": "Tricep",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "10",
                              "sets": [
                                    {
                                          "reps": 20,
                                          "weight": "10"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "10"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "10"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e5",
                              "groupName": "Kettlebell",
                              "name": "Around the waist",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "14",
                              "sets": [
                                    {
                                          "reps": 17,
                                          "weight": "14"
                                    },
                                    {
                                          "reps": 16,
                                          "weight": "14"
                                    },
                                    {
                                          "reps": 17,
                                          "weight": "14"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e6",
                              "groupName": "Kettlebell",
                              "name": "Lateral raise",
                              "targetSets": 3,
                              "targetReps": 11,
                              "targetWeight": "8",
                              "sets": [
                                    {
                                          "reps": 9,
                                          "weight": "8"
                                    },
                                    {
                                          "reps": 8,
                                          "weight": "8"
                                    },
                                    {
                                          "reps": 9,
                                          "weight": "8"
                                    }
                              ]
                        }
                  ]
            }
      },
      {
            "id": "di3ca7rlv5eocn4au2ehob",
            "type": "learning",
            "startedAt": "2026-03-22T03:15:00.000Z",
            "finishedAt": "2026-03-22T03:45:00.000Z",
            "labels": [
                  "learning",
                  "Piano scales — C major"
            ],
            "payload": {
                  "subject": "Piano scales — C major",
                  "source": "Practice",
                  "durationMins": 30,
                  "rating": 2,
                  "notes": null
            }
      },
      {
            "id": "7wmw278um7x6gpymrbj8me",
            "type": "reading",
            "startedAt": "2026-03-23T12:34:00.000Z",
            "finishedAt": "2026-03-23T13:24:00.000Z",
            "labels": [
                  "reading",
                  "Deep Work"
            ],
            "payload": {
                  "title": "Deep Work",
                  "author": "Cal Newport",
                  "pages": 38,
                  "durationMins": 50,
                  "completionPct": 44,
                  "notes": null
            }
      },
      {
            "id": "0swn0dwtzoz",
            "type": "workout",
            "startedAt": "2026-03-23T21:52:47.816Z",
            "finishedAt": "2026-03-23T21:52:47.816Z",
            "labels": [
                  "workout",
                  "Calisthenics",
                  "r2",
                  "Future"
            ],
            "payload": {
                  "routineId": "r2",
                  "routineName": "Calisthenics",
                  "durationSecs": 1740,
                  "exercises": [
                        {
                              "exerciseId": "e7",
                              "groupName": "Future",
                              "name": "Leg up",
                              "targetSets": 3,
                              "targetReps": 16,
                              "sets": [
                                    {
                                          "reps": 16
                                    },
                                    {
                                          "reps": 15
                                    },
                                    {
                                          "reps": 16
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e8",
                              "groupName": "Future",
                              "name": "Plank",
                              "targetSets": 3,
                              "type": "duration",
                              "sets": [
                                    {
                                          "duration": 28
                                    },
                                    {
                                          "duration": 30
                                    },
                                    {
                                          "duration": 29
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e9",
                              "groupName": "Future",
                              "name": "Back up",
                              "targetSets": 3,
                              "targetReps": 12,
                              "sets": [
                                    {
                                          "reps": 12
                                    },
                                    {
                                          "reps": 12
                                    },
                                    {
                                          "reps": 12
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e10",
                              "groupName": "Future",
                              "name": "Squat",
                              "targetSets": 3,
                              "targetReps": 9,
                              "sets": [
                                    {
                                          "reps": 9
                                    },
                                    {
                                          "reps": 9
                                    },
                                    {
                                          "reps": 9
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e11",
                              "groupName": "Future",
                              "name": "Push up",
                              "targetSets": 3,
                              "targetReps": 1,
                              "sets": [
                                    {
                                          "reps": 3
                                    },
                                    {
                                          "reps": 3
                                    },
                                    {
                                          "reps": 2
                                    }
                              ]
                        }
                  ]
            }
      },
      {
            "id": "xwb1ylj7feqgds2yry38ba",
            "type": "focus",
            "startedAt": "2026-03-24T02:00:00.000Z",
            "finishedAt": "2026-03-24T03:20:00.000Z",
            "labels": [
                  "focus",
                  "OrganicLever — landing page"
            ],
            "payload": {
                  "task": "OrganicLever — landing page",
                  "durationMins": 80,
                  "quality": 4,
                  "notes": null
            }
      },
      {
            "id": "5m6d2g5d19d2au5wds2be4",
            "type": "learning",
            "startedAt": "2026-03-25T03:09:00.000Z",
            "finishedAt": "2026-03-25T03:54:00.000Z",
            "labels": [
                  "learning",
                  "Piano — Für Elise intro"
            ],
            "payload": {
                  "subject": "Piano — Für Elise intro",
                  "source": "Practice",
                  "durationMins": 45,
                  "rating": 4,
                  "notes": "Getting smoother."
            }
      },
      {
            "id": "n7wqy8n8gvcpf4409lg5vm",
            "type": "reading",
            "startedAt": "2026-03-26T13:39:00.000Z",
            "finishedAt": "2026-03-26T14:44:00.000Z",
            "labels": [
                  "reading",
                  "Deep Work"
            ],
            "payload": {
                  "title": "Deep Work",
                  "author": "Cal Newport",
                  "pages": 50,
                  "durationMins": 65,
                  "completionPct": 62,
                  "notes": "Deep work is a rare and valuable skill."
            }
      },
      {
            "id": "siy09pxlmsi",
            "type": "workout",
            "startedAt": "2026-03-26T21:52:47.816Z",
            "finishedAt": "2026-03-26T21:52:47.816Z",
            "labels": [
                  "workout",
                  "Kettlebell day",
                  "r1",
                  "Kettlebell"
            ],
            "payload": {
                  "routineId": "r1",
                  "routineName": "Kettlebell day",
                  "durationSecs": 2700,
                  "exercises": [
                        {
                              "exerciseId": "e1",
                              "groupName": "Kettlebell",
                              "name": "Low to mid",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "12",
                              "sets": [
                                    {
                                          "reps": 20,
                                          "weight": "12"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "12"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "12"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e2",
                              "groupName": "Kettlebell",
                              "name": "Mid to up",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "12",
                              "sets": [
                                    {
                                          "reps": 20,
                                          "weight": "12"
                                    },
                                    {
                                          "reps": 19,
                                          "weight": "12"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "12"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e3",
                              "groupName": "Kettlebell",
                              "name": "Front raise",
                              "targetSets": 3,
                              "targetReps": 12,
                              "targetWeight": "8",
                              "sets": [
                                    {
                                          "reps": 12,
                                          "weight": "8"
                                    },
                                    {
                                          "reps": 11,
                                          "weight": "8"
                                    },
                                    {
                                          "reps": 12,
                                          "weight": "8"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e4",
                              "groupName": "Kettlebell",
                              "name": "Tricep",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "12",
                              "sets": [
                                    {
                                          "reps": 17,
                                          "weight": "12"
                                    },
                                    {
                                          "reps": 16,
                                          "weight": "12"
                                    },
                                    {
                                          "reps": 17,
                                          "weight": "12"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e5",
                              "groupName": "Kettlebell",
                              "name": "Around the waist",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "14",
                              "sets": [
                                    {
                                          "reps": 20,
                                          "weight": "14"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "14"
                                    },
                                    {
                                          "reps": 19,
                                          "weight": "14"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e6",
                              "groupName": "Kettlebell",
                              "name": "Lateral raise",
                              "targetSets": 3,
                              "targetReps": 11,
                              "targetWeight": "8",
                              "sets": [
                                    {
                                          "reps": 11,
                                          "weight": "8"
                                    },
                                    {
                                          "reps": 10,
                                          "weight": "8"
                                    },
                                    {
                                          "reps": 11,
                                          "weight": "8"
                                    }
                              ]
                        }
                  ]
            }
      },
      {
            "id": "kia7zz7w09ndzem35nccne",
            "type": "focus",
            "startedAt": "2026-03-27T03:50:00.000Z",
            "finishedAt": "2026-03-27T04:40:00.000Z",
            "labels": [
                  "focus",
                  "Learning Spanish — intensive session"
            ],
            "payload": {
                  "task": "Learning Spanish — intensive session",
                  "durationMins": 50,
                  "quality": 4,
                  "notes": null
            }
      },
      {
            "id": "i08v8ckzt961hablystcb",
            "type": "learning",
            "startedAt": "2026-03-28T07:12:00.000Z",
            "finishedAt": "2026-03-28T08:12:00.000Z",
            "labels": [
                  "learning",
                  "Event sourcing patterns"
            ],
            "payload": {
                  "subject": "Event sourcing patterns",
                  "source": "YouTube",
                  "durationMins": 60,
                  "rating": 5,
                  "notes": null
            }
      },
      {
            "id": "68nf6g8lu3p08z62vkpjcvq",
            "type": "reading",
            "startedAt": "2026-03-29T14:52:00.000Z",
            "finishedAt": "2026-03-29T15:47:00.000Z",
            "labels": [
                  "reading",
                  "Deep Work"
            ],
            "payload": {
                  "title": "Deep Work",
                  "author": "Cal Newport",
                  "pages": 44,
                  "durationMins": 55,
                  "completionPct": 78,
                  "notes": null
            }
      },
      {
            "id": "bo0wn5en72t",
            "type": "workout",
            "startedAt": "2026-03-29T21:52:47.816Z",
            "finishedAt": "2026-03-29T21:52:47.816Z",
            "labels": [
                  "workout",
                  "Super Exercise",
                  "r3",
                  "Circuit A",
                  "Circuit B"
            ],
            "payload": {
                  "routineId": "r3",
                  "routineName": "Super Exercise",
                  "durationSecs": 3600,
                  "exercises": [
                        {
                              "exerciseId": "s1",
                              "groupName": "Circuit A",
                              "name": "Deadlift",
                              "targetSets": 4,
                              "targetReps": 5,
                              "sets": [
                                    {
                                          "reps": 5,
                                          "weight": "80"
                                    },
                                    {
                                          "reps": 5,
                                          "weight": "80"
                                    },
                                    {
                                          "reps": 5,
                                          "weight": "80"
                                    },
                                    {
                                          "reps": 5,
                                          "weight": "80"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "s2",
                              "groupName": "Circuit A",
                              "name": "Bench press",
                              "targetSets": 4,
                              "targetReps": 8,
                              "sets": [
                                    {
                                          "reps": 8,
                                          "weight": "45"
                                    },
                                    {
                                          "reps": 8,
                                          "weight": "45"
                                    },
                                    {
                                          "reps": 8,
                                          "weight": "45"
                                    },
                                    {
                                          "reps": 8,
                                          "weight": "45"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "s3",
                              "groupName": "Circuit B",
                              "name": "Overhead press",
                              "targetSets": 3,
                              "targetReps": 8,
                              "sets": [
                                    {
                                          "reps": 8,
                                          "weight": "24"
                                    },
                                    {
                                          "reps": 8,
                                          "weight": "24"
                                    },
                                    {
                                          "reps": 8,
                                          "weight": "24"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "s7",
                              "groupName": "Circuit B",
                              "name": "Dead bug",
                              "targetSets": 3,
                              "targetReps": 10,
                              "sets": [
                                    {
                                          "reps": 10
                                    },
                                    {
                                          "reps": 10
                                    },
                                    {
                                          "reps": 10
                                    }
                              ]
                        }
                  ]
            }
      },
      {
            "id": "24da8vaee6v24mxbn66srb",
            "type": "focus",
            "startedAt": "2026-03-30T07:29:00.000Z",
            "finishedAt": "2026-03-30T08:29:00.000Z",
            "labels": [
                  "focus",
                  "Financial planning Q2"
            ],
            "payload": {
                  "task": "Financial planning Q2",
                  "durationMins": 60,
                  "quality": 3,
                  "notes": null
            }
      },
      {
            "id": "t7v4rkcyxoj4qggehnv6m",
            "type": "learning",
            "startedAt": "2026-03-31T08:51:00.000Z",
            "finishedAt": "2026-03-31T10:21:00.000Z",
            "labels": [
                  "learning",
                  "Rust ownership model"
            ],
            "payload": {
                  "subject": "Rust ownership model",
                  "source": "The Book",
                  "durationMins": 90,
                  "rating": 3,
                  "notes": "Challenging but fascinating."
            }
      },
      {
            "id": "nfiqkojezyx2iomz3f8cd",
            "type": "reading",
            "startedAt": "2026-04-01T12:48:00.000Z",
            "finishedAt": "2026-04-01T13:18:00.000Z",
            "labels": [
                  "reading",
                  "The Power of Now"
            ],
            "payload": {
                  "title": "The Power of Now",
                  "author": "Eckhart Tolle",
                  "pages": 20,
                  "durationMins": 30,
                  "completionPct": 15,
                  "notes": null
            }
      },
      {
            "id": "thckwmp0mnwhk09lvnrdh",
            "type": "focus",
            "startedAt": "2026-04-02T02:23:00.000Z",
            "finishedAt": "2026-04-02T04:03:00.000Z",
            "labels": [
                  "focus",
                  "OrganicLever — analytics & PRs"
            ],
            "payload": {
                  "task": "OrganicLever — analytics & PRs",
                  "durationMins": 100,
                  "quality": 5,
                  "notes": "In the zone. Best session this month."
            }
      },
      {
            "id": "3vzw3lj0jv",
            "type": "workout",
            "startedAt": "2026-04-02T21:52:47.816Z",
            "finishedAt": "2026-04-02T21:52:47.816Z",
            "labels": [
                  "workout",
                  "Kettlebell day",
                  "r1",
                  "Kettlebell"
            ],
            "payload": {
                  "routineId": "r1",
                  "routineName": "Kettlebell day",
                  "durationSecs": 2760,
                  "exercises": [
                        {
                              "exerciseId": "e1",
                              "groupName": "Kettlebell",
                              "name": "Low to mid",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "14",
                              "sets": [
                                    {
                                          "reps": 16,
                                          "weight": "14"
                                    },
                                    {
                                          "reps": 15,
                                          "weight": "14"
                                    },
                                    {
                                          "reps": 16,
                                          "weight": "14"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e2",
                              "groupName": "Kettlebell",
                              "name": "Mid to up",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "14",
                              "sets": [
                                    {
                                          "reps": 15,
                                          "weight": "14"
                                    },
                                    {
                                          "reps": 14,
                                          "weight": "14"
                                    },
                                    {
                                          "reps": 15,
                                          "weight": "14"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e3",
                              "groupName": "Kettlebell",
                              "name": "Front raise",
                              "targetSets": 3,
                              "targetReps": 12,
                              "targetWeight": "8",
                              "sets": [
                                    {
                                          "reps": 12,
                                          "weight": "8"
                                    },
                                    {
                                          "reps": 12,
                                          "weight": "8"
                                    },
                                    {
                                          "reps": 12,
                                          "weight": "8"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e4",
                              "groupName": "Kettlebell",
                              "name": "Tricep",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "12",
                              "sets": [
                                    {
                                          "reps": 20,
                                          "weight": "12"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "12"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "12"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e5",
                              "groupName": "Kettlebell",
                              "name": "Around the waist",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "16",
                              "sets": [
                                    {
                                          "reps": 16,
                                          "weight": "16"
                                    },
                                    {
                                          "reps": 15,
                                          "weight": "16"
                                    },
                                    {
                                          "reps": 16,
                                          "weight": "16"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e6",
                              "groupName": "Kettlebell",
                              "name": "Lateral raise",
                              "targetSets": 3,
                              "targetReps": 11,
                              "targetWeight": "8",
                              "sets": [
                                    {
                                          "reps": 11,
                                          "weight": "8"
                                    },
                                    {
                                          "reps": 11,
                                          "weight": "8"
                                    },
                                    {
                                          "reps": 11,
                                          "weight": "8"
                                    }
                              ]
                        }
                  ]
            }
      },
      {
            "id": "49qf5kdi81n6agmge26h0m",
            "type": "learning",
            "startedAt": "2026-04-03T09:03:00.000Z",
            "finishedAt": "2026-04-03T09:53:00.000Z",
            "labels": [
                  "learning",
                  "Negotiation techniques"
            ],
            "payload": {
                  "subject": "Negotiation techniques",
                  "source": "Podcast",
                  "durationMins": 50,
                  "rating": 4,
                  "notes": null
            }
      },
      {
            "id": "o3kj5uy8zzfwgggqhezu5",
            "type": "reading",
            "startedAt": "2026-04-04T13:32:00.000Z",
            "finishedAt": "2026-04-04T14:12:00.000Z",
            "labels": [
                  "reading",
                  "The Power of Now"
            ],
            "payload": {
                  "title": "The Power of Now",
                  "author": "Eckhart Tolle",
                  "pages": 30,
                  "durationMins": 40,
                  "completionPct": 35,
                  "notes": null
            }
      },
      {
            "id": "8ivpng70w6echq2vnkglri",
            "type": "learning",
            "startedAt": "2026-04-06T03:17:00.000Z",
            "finishedAt": "2026-04-06T03:42:00.000Z",
            "labels": [
                  "learning",
                  "Bahasa — greetings & numbers"
            ],
            "payload": {
                  "subject": "Bahasa — greetings & numbers",
                  "source": "App",
                  "durationMins": 25,
                  "rating": 4,
                  "notes": null
            }
      },
      {
            "id": "gilhgmq20ww",
            "type": "workout",
            "startedAt": "2026-04-06T21:52:47.816Z",
            "finishedAt": "2026-04-06T21:52:47.816Z",
            "labels": [
                  "workout",
                  "Calisthenics",
                  "r2",
                  "Future"
            ],
            "payload": {
                  "routineId": "r2",
                  "routineName": "Calisthenics",
                  "durationSecs": 1800,
                  "exercises": [
                        {
                              "exerciseId": "e7",
                              "groupName": "Future",
                              "name": "Leg up",
                              "targetSets": 3,
                              "targetReps": 16,
                              "sets": [
                                    {
                                          "reps": 16
                                    },
                                    {
                                          "reps": 16
                                    },
                                    {
                                          "reps": 16
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e8",
                              "groupName": "Future",
                              "name": "Plank",
                              "targetSets": 3,
                              "type": "duration",
                              "sets": [
                                    {
                                          "duration": 30
                                    },
                                    {
                                          "duration": 30
                                    },
                                    {
                                          "duration": 30
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e9",
                              "groupName": "Future",
                              "name": "Back up",
                              "targetSets": 3,
                              "targetReps": 12,
                              "sets": [
                                    {
                                          "reps": 12
                                    },
                                    {
                                          "reps": 12
                                    },
                                    {
                                          "reps": 12
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e10",
                              "groupName": "Future",
                              "name": "Squat",
                              "targetSets": 3,
                              "targetReps": 9,
                              "sets": [
                                    {
                                          "reps": 9
                                    },
                                    {
                                          "reps": 9
                                    },
                                    {
                                          "reps": 9
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e11",
                              "groupName": "Future",
                              "name": "Push up",
                              "targetSets": 3,
                              "targetReps": 1,
                              "sets": [
                                    {
                                          "reps": 4
                                    },
                                    {
                                          "reps": 4
                                    },
                                    {
                                          "reps": 3
                                    }
                              ]
                        }
                  ]
            }
      },
      {
            "id": "hf9nghwhwcdl52q0ekjadg",
            "type": "learning",
            "startedAt": "2026-04-09T03:16:00.000Z",
            "finishedAt": "2026-04-09T03:46:00.000Z",
            "labels": [
                  "learning",
                  "Bahasa — daily conversation"
            ],
            "payload": {
                  "subject": "Bahasa — daily conversation",
                  "source": "App",
                  "durationMins": 30,
                  "rating": 4,
                  "notes": null
            }
      },
      {
            "id": "11fy2o1zydyb",
            "type": "workout",
            "startedAt": "2026-04-09T21:52:47.816Z",
            "finishedAt": "2026-04-09T21:52:47.816Z",
            "labels": [
                  "workout",
                  "Kettlebell day",
                  "r1",
                  "Kettlebell"
            ],
            "payload": {
                  "routineId": "r1",
                  "routineName": "Kettlebell day",
                  "durationSecs": 2820,
                  "exercises": [
                        {
                              "exerciseId": "e1",
                              "groupName": "Kettlebell",
                              "name": "Low to mid",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "14",
                              "sets": [
                                    {
                                          "reps": 20,
                                          "weight": "14"
                                    },
                                    {
                                          "reps": 19,
                                          "weight": "14"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "14"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e2",
                              "groupName": "Kettlebell",
                              "name": "Mid to up",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "14",
                              "sets": [
                                    {
                                          "reps": 19,
                                          "weight": "14"
                                    },
                                    {
                                          "reps": 18,
                                          "weight": "14"
                                    },
                                    {
                                          "reps": 19,
                                          "weight": "14"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e3",
                              "groupName": "Kettlebell",
                              "name": "Front raise",
                              "targetSets": 3,
                              "targetReps": 12,
                              "targetWeight": "10",
                              "sets": [
                                    {
                                          "reps": 10,
                                          "weight": "10"
                                    },
                                    {
                                          "reps": 9,
                                          "weight": "10"
                                    },
                                    {
                                          "reps": 10,
                                          "weight": "10"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e4",
                              "groupName": "Kettlebell",
                              "name": "Tricep",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "14",
                              "sets": [
                                    {
                                          "reps": 16,
                                          "weight": "14"
                                    },
                                    {
                                          "reps": 15,
                                          "weight": "14"
                                    },
                                    {
                                          "reps": 16,
                                          "weight": "14"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e5",
                              "groupName": "Kettlebell",
                              "name": "Around the waist",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "16",
                              "sets": [
                                    {
                                          "reps": 20,
                                          "weight": "16"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "16"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "16"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e6",
                              "groupName": "Kettlebell",
                              "name": "Lateral raise",
                              "targetSets": 3,
                              "targetReps": 11,
                              "targetWeight": "10",
                              "sets": [
                                    {
                                          "reps": 9,
                                          "weight": "10"
                                    },
                                    {
                                          "reps": 8,
                                          "weight": "10"
                                    },
                                    {
                                          "reps": 9,
                                          "weight": "10"
                                    }
                              ]
                        }
                  ]
            }
      },
      {
            "id": "md1yqx04l8",
            "type": "workout",
            "startedAt": "2026-04-13T21:52:47.816Z",
            "finishedAt": "2026-04-13T21:52:47.816Z",
            "labels": [
                  "workout",
                  "Super Exercise",
                  "r3",
                  "Circuit A",
                  "Circuit B"
            ],
            "payload": {
                  "routineId": "r3",
                  "routineName": "Super Exercise",
                  "durationSecs": 3720,
                  "exercises": [
                        {
                              "exerciseId": "s1",
                              "groupName": "Circuit A",
                              "name": "Deadlift",
                              "targetSets": 4,
                              "targetReps": 5,
                              "sets": [
                                    {
                                          "reps": 5,
                                          "weight": "85"
                                    },
                                    {
                                          "reps": 5,
                                          "weight": "85"
                                    },
                                    {
                                          "reps": 5,
                                          "weight": "85"
                                    },
                                    {
                                          "reps": 5,
                                          "weight": "85"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "s2",
                              "groupName": "Circuit A",
                              "name": "Bench press",
                              "targetSets": 4,
                              "targetReps": 8,
                              "sets": [
                                    {
                                          "reps": 8,
                                          "weight": "47"
                                    },
                                    {
                                          "reps": 8,
                                          "weight": "47"
                                    },
                                    {
                                          "reps": 8,
                                          "weight": "47"
                                    },
                                    {
                                          "reps": 7,
                                          "weight": "47"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "s3",
                              "groupName": "Circuit B",
                              "name": "Overhead press",
                              "targetSets": 3,
                              "targetReps": 8,
                              "sets": [
                                    {
                                          "reps": 8,
                                          "weight": "26"
                                    },
                                    {
                                          "reps": 8,
                                          "weight": "26"
                                    },
                                    {
                                          "reps": 8,
                                          "weight": "26"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "s7",
                              "groupName": "Circuit B",
                              "name": "Dead bug",
                              "targetSets": 3,
                              "targetReps": 10,
                              "sets": [
                                    {
                                          "reps": 10
                                    },
                                    {
                                          "reps": 10
                                    },
                                    {
                                          "reps": 10
                                    }
                              ]
                        }
                  ]
            }
      },
      {
            "id": "ft1wwbie0z",
            "type": "workout",
            "startedAt": "2026-04-16T21:52:47.816Z",
            "finishedAt": "2026-04-16T21:52:47.816Z",
            "labels": [
                  "workout",
                  "Kettlebell day",
                  "r1",
                  "Kettlebell"
            ],
            "payload": {
                  "routineId": "r1",
                  "routineName": "Kettlebell day",
                  "durationSecs": 2880,
                  "exercises": [
                        {
                              "exerciseId": "e1",
                              "groupName": "Kettlebell",
                              "name": "Low to mid",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "14",
                              "sets": [
                                    {
                                          "reps": 20,
                                          "weight": "14"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "14"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "14"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e2",
                              "groupName": "Kettlebell",
                              "name": "Mid to up",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "14",
                              "sets": [
                                    {
                                          "reps": 20,
                                          "weight": "14"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "14"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "14"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e3",
                              "groupName": "Kettlebell",
                              "name": "Front raise",
                              "targetSets": 3,
                              "targetReps": 12,
                              "targetWeight": "10",
                              "sets": [
                                    {
                                          "reps": 12,
                                          "weight": "10"
                                    },
                                    {
                                          "reps": 12,
                                          "weight": "10"
                                    },
                                    {
                                          "reps": 12,
                                          "weight": "10"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e4",
                              "groupName": "Kettlebell",
                              "name": "Tricep",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "14",
                              "sets": [
                                    {
                                          "reps": 20,
                                          "weight": "14"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "14"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "14"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e5",
                              "groupName": "Kettlebell",
                              "name": "Around the waist",
                              "targetSets": 3,
                              "targetReps": 20,
                              "targetWeight": "16",
                              "sets": [
                                    {
                                          "reps": 20,
                                          "weight": "16"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "16"
                                    },
                                    {
                                          "reps": 20,
                                          "weight": "16"
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e6",
                              "groupName": "Kettlebell",
                              "name": "Lateral raise",
                              "targetSets": 3,
                              "targetReps": 11,
                              "targetWeight": "10",
                              "sets": [
                                    {
                                          "reps": 11,
                                          "weight": "10"
                                    },
                                    {
                                          "reps": 10,
                                          "weight": "10"
                                    },
                                    {
                                          "reps": 11,
                                          "weight": "10"
                                    }
                              ]
                        }
                  ]
            }
      },
      {
            "id": "c2jft4rhact",
            "type": "workout",
            "startedAt": "2026-04-18T21:52:47.816Z",
            "finishedAt": "2026-04-18T21:52:47.816Z",
            "labels": [
                  "workout",
                  "Calisthenics",
                  "r2",
                  "Future"
            ],
            "payload": {
                  "routineId": "r2",
                  "routineName": "Calisthenics",
                  "durationSecs": 1860,
                  "exercises": [
                        {
                              "exerciseId": "e7",
                              "groupName": "Future",
                              "name": "Leg up",
                              "targetSets": 3,
                              "targetReps": 16,
                              "sets": [
                                    {
                                          "reps": 16
                                    },
                                    {
                                          "reps": 16
                                    },
                                    {
                                          "reps": 16
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e8",
                              "groupName": "Future",
                              "name": "Plank",
                              "targetSets": 3,
                              "type": "duration",
                              "sets": [
                                    {
                                          "duration": 32
                                    },
                                    {
                                          "duration": 31
                                    },
                                    {
                                          "duration": 32
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e9",
                              "groupName": "Future",
                              "name": "Back up",
                              "targetSets": 3,
                              "targetReps": 12,
                              "sets": [
                                    {
                                          "reps": 12
                                    },
                                    {
                                          "reps": 12
                                    },
                                    {
                                          "reps": 12
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e10",
                              "groupName": "Future",
                              "name": "Squat",
                              "targetSets": 3,
                              "targetReps": 9,
                              "sets": [
                                    {
                                          "reps": 9
                                    },
                                    {
                                          "reps": 9
                                    },
                                    {
                                          "reps": 9
                                    }
                              ]
                        },
                        {
                              "exerciseId": "e11",
                              "groupName": "Future",
                              "name": "Push up",
                              "targetSets": 3,
                              "targetReps": 1,
                              "sets": [
                                    {
                                          "reps": 5
                                    },
                                    {
                                          "reps": 5
                                    },
                                    {
                                          "reps": 4
                                    }
                              ]
                        }
                  ]
            }
      }
],
  };

  let db = load();
  if (!db.routines) { db = JSON.parse(JSON.stringify(SEED)); persist(db); }

  // Migrate old sessions → events if needed
  if (db.sessions && !db.events) {
    db.events = (db.sessions || []).map(s => ({
      id: s.id, type: 'workout',
      startedAt: s.startedAt, finishedAt: s.finishedAt,
      labels: ['workout', s.routineName, s.routineId].filter(Boolean),
      payload: { routineId: s.routineId, routineName: s.routineName,
        durationSecs: s.durationSecs || 0, exercises: s.exercises || [] },
    }));
    delete db.sessions;
    persist(db);
  }

  // ── API ────────────────────────────────────────────────────────────────────
  const DB = {
    uuid: uid,

    // ── Settings ────────────────────────────────────────────────────────────
    getSettings() { return { restSeconds: 60, darkMode: false, name: 'Yoka', ...(db.settings || {}) }; },
    saveSettings(s) { db.settings = { ...db.settings, ...s }; persist(db); },

    // ── Routines (workout templates) ─────────────────────────────────────────
    getRoutines() { return JSON.parse(JSON.stringify(db.routines || [])); },
    getRoutine(id) {
      const r = (db.routines || []).find(r => r.id === id);
      return r ? JSON.parse(JSON.stringify(r)) : null;
    },
    saveRoutine(routine) {
      db.routines = db.routines || [];
      const r = { type: 'workout', ...routine, id: routine.id || uid() };
      const idx = db.routines.findIndex(x => x.id === r.id);
      if (idx >= 0) db.routines[idx] = r;
      else db.routines.push({ createdAt: new Date().toISOString(), ...r });
      persist(db); return r;
    },
    deleteRoutine(id) { db.routines = (db.routines || []).filter(r => r.id !== id); persist(db); },

    // ── Generic Event API ────────────────────────────────────────────────────
    // filter: { type?, labels?: string[], since?: Date, until?: Date, id?: string }
    getEvents(filter = {}) {
      let events = JSON.parse(JSON.stringify([...(db.events || [])].reverse()));
      if (filter.id)     events = events.filter(e => e.id === filter.id);
      if (filter.type)   events = events.filter(e => e.type === filter.type);
      if (filter.labels) events = events.filter(e =>
        filter.labels.every(l => (e.labels || []).includes(l)));
      if (filter.since)  events = events.filter(e => new Date(e.startedAt) >= filter.since);
      if (filter.until)  events = events.filter(e => new Date(e.startedAt) < filter.until);
      return events;
    },

    saveEvent(event) {
      db.events = db.events || [];
      const e = { ...event, id: event.id || uid() };
      if (!e.labels) e.labels = [e.type];
      const idx = db.events.findIndex(x => x.id === e.id);
      if (idx >= 0) db.events[idx] = e; else db.events.push(e);
      persist(db); return e;
    },

    deleteEvent(id) { db.events = (db.events || []).filter(e => e.id !== id); persist(db); },

    // ── Custom event types ───────────────────────────────────────────────────
    getCustomTypes() { return JSON.parse(JSON.stringify(db.customTypes || [])); },
    saveCustomType(ct) {
      db.customTypes = db.customTypes || [];
      const t = { ...ct, id: ct.id || uid() };
      const idx = db.customTypes.findIndex(x => x.id === t.id);
      if (idx >= 0) db.customTypes[idx] = t;
      else db.customTypes.push({ createdAt: new Date().toISOString(), ...t });
      persist(db); return t;
    },
    deleteCustomType(id) { db.customTypes = (db.customTypes || []).filter(t => t.id !== id); persist(db); },

    // ── Workout helpers (thin wrappers) ──────────────────────────────────────
    getSessions()    { return this.getEvents(); }, // all event types for history
    getSession(id)   { return this.getEvents({ type: 'workout', id })[0] || null; },

    saveSession(session) {
      const labels = [
        'workout',
        ...(session.routineName ? [session.routineName] : []),
        ...(session.routineId   ? [session.routineId]   : []),
        ...[...new Set((session.exercises || []).map(e => e.groupName).filter(Boolean))],
      ];
      return this.saveEvent({
        id:         session.id,
        type:       'workout',
        startedAt:  session.startedAt,
        finishedAt: session.finishedAt,
        labels,
        payload: {
          routineId:    session.routineId   || null,
          routineName:  session.routineName || 'Quick workout',
          durationSecs: session.durationSecs || 0,
          exercises:    session.exercises   || [],
        },
      });
    },

    // Update per-exercise streaks (72-hour gap window)
    updateStreaks(updates, currentEventId) {
      const now = new Date();
      const SEVENTY_TWO_HOURS = 72 * 3600000;

      // Most recent previous workout event timestamp per exerciseId
      const prevTsByExercise = {};
      (db.events || []).forEach(ev => {
        if (ev.id === currentEventId || ev.type !== 'workout') return;
        const ts = new Date(ev.startedAt);
        (ev.payload?.exercises || []).forEach(ex => {
          if (!ex.exerciseId) return;
          if (!prevTsByExercise[ex.exerciseId] || ts > new Date(prevTsByExercise[ex.exerciseId]))
            prevTsByExercise[ex.exerciseId] = ev.startedAt;
        });
      });

      (db.routines || []).forEach(routine =>
        (routine.groups || []).forEach(group =>
          (group.exercises || []).forEach(ex => {
            const u = updates.find(u => u.exerciseId === ex.id);
            if (!u) return;
            if (!u.hitTarget) { ex.dayStreak = 0; return; }
            const prevTs = prevTsByExercise[ex.id];
            if (!prevTs) {
              ex.dayStreak = 1;
            } else {
              const gapMs = now - new Date(prevTs);
              ex.dayStreak = gapMs <= SEVENTY_TWO_HOURS
                ? (ex.dayStreak || 0) + 1
                : 1;
            }
          })
        )
      );
      persist(db);
    },

    // ── Analytics ────────────────────────────────────────────────────────────
    getWeeklyStats() {
      const now     = new Date();
      const weekAgo = new Date(now - 7 * 86400000);
      const workouts = this.getEvents({ type: 'workout' });
      const thisWeek = workouts.filter(e => new Date(e.startedAt) >= weekAgo);

      const totalSets = thisWeek.reduce((n, e) =>
        n + (e.payload?.exercises || []).reduce((m, ex) => m + (ex.sets || []).length, 0), 0);
      const totalMs = thisWeek.reduce((n, e) =>
        n + (e.finishedAt ? new Date(e.finishedAt) - new Date(e.startedAt) : 0), 0);

      // Streak: consecutive weeks with 2+ events
      let streak = 0;
      let weekStart = new Date(now);
      while (true) {
        const ws = new Date(weekStart - 7 * 86400000);
        const wEvents = workouts.filter(e => {
          const t = new Date(e.startedAt);
          return t >= ws && t < weekStart;
        });
        if (wEvents.length >= 2) { streak++; weekStart = ws; } else break;
      }

      return {
        workoutsThisWeek: thisWeek.length,
        streak,
        totalMins: Math.round(totalMs / 60000),
        totalSets,
      };
    },

    getVolume(days) {
      const since = new Date(Date.now() - days * 86400000);
      return Math.round(this.getEvents({ type: 'workout', since }).reduce((total, e) =>
        total + (e.payload?.exercises || []).reduce((et, ex) =>
          et + (ex.sets || []).reduce((st, set) => {
            if (!set.weight) return st;
            const w = String(set.weight);
            const kg = w.includes('+')
              ? w.split('+').reduce((a, x) => a + (parseFloat(x) || 0), 0)
              : parseFloat(w) || 0;
            return st + kg * (set.reps || 0);
          }, 0), 0), 0));
    },

    getLast7Days() {
      const workouts = this.getEvents({ type: 'workout' });
      // Start from Monday of the current week, show 7 days ending today
      const now = new Date();
      const todayDow = now.getDay(); // 0=Sun,1=Mon,...,6=Sat
      // Days since last Monday (Mon=0 in our offset)
      const daysSinceMon = (todayDow + 6) % 7; // 0=Mon,6=Sun
      // Build 7-day window: last Monday → today, always 7 slots
      return Array.from({ length: 7 }, (_, i) => {
        const offset = daysSinceMon - i; // positive = past, negative = future (clamp)
        const d = new Date(Date.now() - offset * 86400000);
        const dateStr = d.toDateString();
        const allEvents = this.getEvents();
        const dayEvents = allEvents.filter(e => new Date(e.startedAt).toDateString() === dateStr);
        const durationMins = dayEvents.reduce((n, e) =>
          n + (e.finishedAt ? Math.round((new Date(e.finishedAt) - new Date(e.startedAt)) / 60000) : 0), 0);
        return {
          date: d, label: d.toLocaleDateString('en', { weekday: 'short' }),
          sessions: dayEvents.length, durationMins,
        };
      });
    },

    getExerciseProgress(sinceDays) {
      const since = sinceDays ? new Date(Date.now() - sinceDays * 86400000) : null;
      const workouts = [...this.getEvents({ type: 'workout', ...(since ? { since } : {}) })]
        .sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt));
      const map = {};

      workouts.forEach(ev => {
        (ev.payload?.exercises || []).forEach(ex => {
          if (!ex.name) return;
          if (!map[ex.name]) map[ex.name] = { points: [], routineName: ev.payload?.routineName, isDuration: false };
          const sets = ex.sets || [];
          if (!sets.length) return;
          const isDuration = sets.some(s => s.duration != null);
          map[ex.name].isDuration = isDuration;
          if (isDuration) {
            const maxDur = Math.max(...sets.map(s => s.duration || 0));
            map[ex.name].points.push({ date: new Date(ev.startedAt), eventId: ev.id,
              maxDuration: maxDur, totalDuration: sets.reduce((n, s) => n + (s.duration || 0), 0),
              sets: sets.length, targetSets: ex.targetSets });
          } else {
            let maxWeight = 0, maxReps = 0, volume = 0, best1RM = 0;
            sets.forEach(set => {
              const reps = set.reps || 0;
              const w = set.weight ? (() => {
                const ws = String(set.weight);
                return ws.includes('+')
                  ? ws.split('+').reduce((a, x) => a + (parseFloat(x) || 0), 0)
                  : parseFloat(ws) || 0;
              })() : 0;
              if (w > maxWeight) maxWeight = w;
              if (reps > maxReps) maxReps = reps;
              volume += w * reps;
              if (w > 0 && reps > 0 && reps <= 10) {
                const est = w * (36 / (37 - reps));
                if (est > best1RM) best1RM = parseFloat(est.toFixed(1));
              }
            });
            map[ex.name].points.push({ date: new Date(ev.startedAt), eventId: ev.id,
              maxWeight, maxReps, volume: Math.round(volume), best1RM,
              sets: sets.length, targetSets: ex.targetSets });
          }
        });
      });

      Object.values(map).forEach(({ points, isDuration }) => {
        if (isDuration) {
          let prDur = 0;
          points.forEach(p => { p.isPR = p.maxDuration > prDur; if (p.isPR) prDur = p.maxDuration; });
        } else {
          let prW = 0, prR = 0, prV = 0, pr1 = 0;
          points.forEach(p => {
            p.isPR_weight = p.maxWeight > prW; if (p.isPR_weight) prW = p.maxWeight;
            p.isPR_reps   = p.maxReps   > prR; if (p.isPR_reps)   prR = p.maxReps;
            p.isPR_vol    = p.volume    > prV; if (p.isPR_vol)    prV = p.volume;
            p.isPR_1rm    = p.best1RM   > pr1; if (p.isPR_1rm)   pr1 = p.best1RM;
            p.isPR = p.isPR_weight || p.isPR_1rm;
          });
        }
      });
      return map;
    },
  };

  window.DB = DB;
})();
