import mongoose from 'mongoose';

const examSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    assignedUsers: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      default: [],
    },
    sections: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    questions: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const Exam = mongoose.models.Exam || mongoose.model('Exam', examSchema);

export default Exam;
