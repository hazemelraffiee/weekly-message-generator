import React from 'react';
import GradeDisplay from '@/components/Common/GradeDisplay';
import GradingTable from '@/components/Common/GradingTable';

const OldHomeworkGradingSection = ({ students, types, grades, attendance, onGradesChange }) => {

  const handleGrade = (studentId, typeId, value) => {
    const newGrades = { ...grades.grades };

    if (!value?.toString().trim()) {
      if (newGrades[studentId]) {
        delete newGrades[studentId][typeId];
        if (Object.keys(newGrades[studentId]).length === 0) {
          delete newGrades[studentId];
        }
      }
    } else {
      if (!newGrades[studentId]) newGrades[studentId] = {};
      newGrades[studentId][typeId] = value.toString();
    }

    onGradesChange({
      types: grades.types,
      grades: newGrades,
      comments: grades.comments
    });
  };

  const handleComment = (studentId, newComment) => {
    const newComments = { ...grades.comments };

    if (!newComment) {
      delete newComments[studentId];
    } else {
      newComments[studentId] = newComment;
    }

    onGradesChange({
      types: grades.types,
      grades: grades.grades,
      comments: newComments,
    });
  };

  const renderGradeCell = (student, typeId, currentValue, type) => {
    return (
      <div className="w-full text-center">
        <GradeDisplay
          initialValue={currentValue ? Number(currentValue) : null}
          gradingSystem={type.gradingSystem || 'german'}
          editable={true}
          min={type.minGrade || 1.0}
          max={type.maxGrade || 5.0}
          onChange={(value) => handleGrade(student.id, typeId, value)}
          placeholder={(() => {
            const names = student.name.trim().split(' ');
            return names[0] === 'عبد' && names[1] ? `${names[0]} ${names[1]}` : names[0];
          })()}
          studentName={student.name}
          homeworkType={type.label}
        />
      </div>
    );
  };

  return (
    <GradingTable
      students={students}
      types={types}
      grades={grades.grades}
      comments={grades.comments}
      attendance={attendance}
      onGradeChange={handleGrade}
      onCommentChange={handleComment}
      renderGradeCell={renderGradeCell}
      className="mb-8"
    />
  );
};

export default OldHomeworkGradingSection;