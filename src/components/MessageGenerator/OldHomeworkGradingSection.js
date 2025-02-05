import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Check, ChevronDown, Trash2, MessageCircle, PenLine } from 'lucide-react';
import useClickOutside from '@/hooks/useClickOutside';
import GradeDisplay from '@/components/Common/GradeDisplay';

const styles = {
  input: "px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100",
  button: {
    base: "px-4 py-2 rounded-md transition-colors",
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-gray-400 hover:text-gray-300"
  }
};

const CommentCell = ({ studentId, comment, onSaveComment, onCancel, placeholder = "أضف ملاحظة..." }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(comment || "");
  const formRef = useRef(null);

  useEffect(() => {
    if (!isEditing) {
      setValue(comment || "");
    }
  }, [comment, isEditing]);

  useClickOutside(formRef, () => {
    if (isEditing) {
      handleSave();
    }
  });

  const handleSave = () => {
    onSaveComment(studentId, value);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setValue(comment || "");
    setIsEditing(false);
    onCancel?.();
  };

  const handleDeleteComment = (e) => {
    e.stopPropagation();
    onSaveComment(studentId, "");
    setValue("");
    onCancel?.();
  };

  if (!isEditing) {
    return (
      <div className="p-4 bg-gray-800/50 text-gray-200 text-sm">
        {comment ? (
          <div className="flex items-start justify-between">
            <button onClick={() => setIsEditing(true)} className={styles.button.ghost}>
              {comment}
            </button>
            <div className="flex items-center gap-3">
              <button onClick={handleDeleteComment} className={styles.button.ghost}>
                <Trash2 className="h-4 w-4 inline-block" />
              </button>
              <button onClick={() => setIsEditing(true)} className={styles.button.ghost}>
                <PenLine className="h-4 w-4 inline-block" />
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setIsEditing(true)} className={styles.button.ghost}>
            <MessageCircle className="h-4 w-4 inline-block mr-1" />
            <span>إضافة ملاحظة</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="flex items-start gap-2 py-2 px-4 bg-gray-800/50">
      <textarea name="comment" className={styles.input + " flex-1 min-h-[60px] text-sm resize-none"} placeholder={placeholder} autoFocus value={value} onChange={(e) => setValue(e.target.value)} />
      <div className="flex flex-col gap-1">
        <button type="submit" className={`${styles.button.base} p-1.5 text-green-400 hover:bg-green-900/50`}>
          <Check className="h-4 w-4" />
        </button>
        <button type="button" onClick={handleCancel} className={`${styles.button.base} p-1.5 text-red-400 hover:bg-red-900/50`}>
          <X className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
};

const OldHomeworkGradingSection = ({ students, types, grades, attendance, onGradesChange }) => {
  const [openCommentStudentId, setOpenCommentStudentId] = useState(null);

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
    const trimmed = (newComment || "").trim();
    if (!trimmed) {
      delete newComments[studentId];
    } else {
      newComments[studentId] = trimmed;
    }
    onGradesChange({
      types: grades.types,
      grades: grades.grades,
      comments: newComments,
    });
  };

  const handleType = (action, typeData) => {
    const newTypes = { ...grades.types };
    switch (action) {
      case 'add':
        const id = typeData.label.toLowerCase().replace(/\s+/g, '_');
        newTypes[id] = { ...typeData, id };
        onGradesChange({
          types: newTypes,
          grades: grades.grades,
          comments: grades.comments
        });
        break;
      case 'remove':
        delete newTypes[typeData];
        const newGrades = { ...grades.grades };
        Object.keys(newGrades).forEach(studentId => {
          if (newGrades[studentId][typeData]) {
            delete newGrades[studentId][typeData];
            if (Object.keys(newGrades[studentId]).length === 0) {
              delete newGrades[studentId];
            }
          }
        });
        onGradesChange({
          types: newTypes,
          grades: newGrades,
          comments: grades.comments
        });
        break;
      case 'reset':
        onGradesChange({
          types: homeworkTypes,
          grades: {},
          comments: grades.comments
        });
        break;
    }
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
        />
      </div>
    );
  };

  return (
    <div className="w-full mb-8 border border-gray-800 rounded-lg bg-gray-900/80" dir="rtl">
      <div className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="px-4 py-3 bg-gray-800/50 border-b border-gray-700 relative">
                  <div className="items-center justify-between gap-2">
                    <span>الطالب</span>
                  </div>
                </th>
                {Object.entries(types).map(([typeId, type]) => (
                  <th key={typeId} className={`px-4 py-3 bg-gray-800/50 border-b border-gray-700 ${type.style}`}>
                    <div className="items-center justify-between gap-2">
                      <span>{type.label}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const hasComment = Boolean(grades.comments[student.id]);
                const isRowOpen = hasComment || openCommentStudentId === student.id;

                return (
                  <React.Fragment key={student.id}>
                    <tr className="border-b border-gray-800 last:border-0 hover:bg-gray-800/30">
                      <td className="px-4 py-3">
                        <span className={!attendance[student.id]?.present ? 'text-red-300 hover:text-red-200' : 'text-gray-300'}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (openCommentStudentId == student.id) {
                                setOpenCommentStudentId(null);
                              } else {
                                setOpenCommentStudentId(student.id);
                              }
                            }}
                            className={`${styles.button.ghost} ${!attendance[student.id]?.present ? 'text-red-500 hover:text-red-300' : ''}`}
                          >
                            {student.name}
                          </button>
                        </span>
                      </td>
                      {Object.entries(types).map(([typeId, type]) => (
                        <td key={typeId} className="px-4 py-3 text-center">
                          {renderGradeCell(student, typeId, grades.grades[student.id]?.[typeId], type)}
                        </td>
                      ))}
                    </tr>
                    {isRowOpen && (
                      <tr>
                        <td colSpan={Object.keys(types).length + 2} className="p-0">
                          <CommentCell
                            studentId={student.id}
                            comment={grades.comments[student.id] || ""}
                            onSaveComment={(sid, newComment) => {
                              handleComment(sid, newComment);
                              if (!newComment.trim()) {
                                setOpenCommentStudentId(null);
                              }
                            }}
                            onCancel={() => setOpenCommentStudentId(null)}
                            placeholder="اكتب ملاحظة حول الطالب..."
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OldHomeworkGradingSection;