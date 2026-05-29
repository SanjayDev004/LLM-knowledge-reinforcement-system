const calculateNextReview = (currentSchedule, score) => {
  let { interval, easeFactor, repetitions } = currentSchedule;

  if (score >= 3) {
    
    if (repetitions === 0) {
      interval = 1;        
    } else if (repetitions === 1) {
      interval = 3;        
    } else if (repetitions === 2) {
      interval = 7;        
    } else if (repetitions === 3) {
      interval = 14;       
    } else {
      interval = 14;       
    }

    repetitions += 1;

    
    easeFactor = easeFactor + (0.1 - (5 - score) * (0.08 + (5 - score) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;
    if (easeFactor > 3.0) easeFactor = 3.0;

  } else {
    repetitions = 0;
    interval    = 1;
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    nextReviewDate,
    interval,
    easeFactor: parseFloat(easeFactor.toFixed(2)),
    repetitions,
  };
};

const isDueToday = (nextReviewDate) => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return new Date(nextReviewDate) <= today;
};

const getVerdict = (score) => {
  if (score >= 5) return "perfect";
  if (score >= 3) return "correct";
  if (score >= 1) return "partial";
  return "wrong";
};

module.exports = { calculateNextReview, isDueToday, getVerdict };