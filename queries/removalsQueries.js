exports.removalQueries = {
  COMPLETE: {
    transporterID: { $ne: null },
    payment: { $gt: 0 },
    datetimeRemoval: { $ne: null },
    status: { $ne: "DELETED" },
    "materials.quantity": { $gt: 0 },
  },
  INCOMPLETE: {
    status: { $ne: "DELETED" },
    $or: [
      { transporterID: null },
      { payment: 0 },
      { datetimeRemoval: null },
      { "materials.quantity": { $not: { $gt: 0 } } }, // ningun material sea mayor a cero
    ],
  },
  SUSCRIPTION: {
    status: { $ne: "DELETED" },
    author: "WEBAPP_SUSCRIPTION",
    $or: [
      { transporterID: null },
      { payment: 0 },
      { datetimeRemoval: null },
      { "materials.quantity": { $not: { $gt: 0 } } }, // ningun material sea mayor a cero
    ],
  },
  EXTRA: {
    status: { $ne: "DELETED" },
    author: "WEBAPP_Extra",
    $or: [
      { transporterID: null },
      { payment: 0 },
      { datetimeRemoval: null },
      { "materials.quantity": { $not: { $gt: 0 } } }, // ningun material sea mayor a cero
    ],
  },
};
