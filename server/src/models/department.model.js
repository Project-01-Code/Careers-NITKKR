import mongoose, { Schema } from 'mongoose';

const departmentSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Department code is required'],
      uppercase: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

departmentSchema.methods.toJSON = function () {
  const departmentObject = this.toObject();
  delete departmentObject.__v;
  return departmentObject;
};

departmentSchema.index({ code: 1 }, { unique: true });
departmentSchema.index({ isActive: 1 });

export const Department = mongoose.model('Department', departmentSchema);
