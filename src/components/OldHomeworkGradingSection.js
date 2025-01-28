import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Check, ChevronDown, Trash2, MessageCircle, PenLine } from 'lucide-react';
import useClickOutside from '@/hooks/useClickOutside';

const styles = {
  input: "px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100",
  button: {
    base: "px-4 py-2 rounded-md transition-colors",
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-gray-400 hover:text-gray-300"
  }
};

const isValidGrade = grade => {
  const num = Number(grade);
  return !isNaN(num) && num >= 1 && num <= 6;
};

const EditableCell = ({ currentValue, onSave, onCancel }) => {
  const [value, setValue] = useState(currentValue ?? "");
  const formRef = useRef(null);

  // Use the custom hook to detect clicks outside
  useClickOutside(formRef, () => {
    // If user hasn't clicked "X" or "Check" but clicked away, we still save.
    onSave(value);
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(value);
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex items-center gap-1"
    >
      <input
        name="grade"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-16 px-2 py-1 bg-gray-800 border border-gray-700 rounded-md text-gray-100 text-center"
        autoFocus
      />
      <button
        type="submit"
        className="p-1 text-green-400 hover:bg-green-900/50 rounded-md"
      >
        <Check className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="p-1 text-red-400 hover:bg-red-900/50 rounded-md"
      >
        <X className="h-4 w-4" />
      </button>
    </form>
  );
};

const CommentCell = ({
  studentId,
  comment,
  onSaveComment,
  onCancel,       // <-- new
  placeholder = "أضف ملاحظة..."
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(comment || "");

  const formRef = useRef(null);

  useEffect(() => {
    if (!isEditing) {
      setValue(comment || "");
    }
  }, [comment, isEditing]);

  // If user clicks outside, auto-save (or you could auto-cancel).
  useClickOutside(formRef, () => {
    if (isEditing) {
      handleSave();
    }
  });

  // We can either auto-save or auto-cancel on outside click;
  // adapt as you see fit.
  const handleSave = () => {
    onSaveComment(studentId, value);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setValue(comment || "");
    setIsEditing(false);
    onCancel?.(); // notify parent to close row
  };

  const handleDeleteComment = (e) => {
    e.stopPropagation(); // so it doesn’t also trigger setIsEditing(true)
    onSaveComment(studentId, "");  // save an empty comment
    setValue("");
    onCancel?.();                  // close row if needed
  };

  if (!isEditing) {
    // VIEW MODE
    return (
      <div className="p-4 bg-gray-800/50 text-gray-200 text-sm">
        {comment ? (
          <div className="flex items-start justify-between">
            <button
              onClick={() => setIsEditing(true)}
              className="text-gray-400 hover:text-gray-200"
            >
              {comment}
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={handleDeleteComment}
                className="text-gray-400 hover:text-gray-200"
              >
                <Trash2 className="h-4 w-4 inline-block" />
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="text-gray-400 hover:text-gray-200"
              >
                <PenLine className="h-4 w-4 inline-block" />
              </button>
            </div>



          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-gray-400 hover:text-gray-200"
          >
            <MessageCircle className="h-4 w-4 inline-block mr-1" />
            <span>إضافة ملاحظة</span>
          </button>
        )}
      </div>
    );
  }

  // EDIT MODE
  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
      className="flex items-start gap-2 py-2 px-4 bg-gray-800/50"
    >
      <textarea
        name="comment"
        className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 flex-1 min-h-[60px] text-sm resize-none"
        placeholder={placeholder}
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="flex flex-col gap-1">
        <button
          type="submit"
          className="p-1.5 text-green-400 hover:bg-green-900/50 rounded-md"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="p-1.5 text-red-400 hover:bg-red-900/50 rounded-md"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
};

const OldHomeworkGradingSection = ({
  students,
  types,
  grades,
  attendance,
  onGradesChange
}) => {
  const [expanded, setExpanded] = useState(false);
  const [addingType, setAddingType] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [deletingType, setDeletingType] = useState(null);
  const [openCommentStudentId, setOpenCommentStudentId] = useState(null);

  const handleGrade = (studentId, typeId, value) => {
    const newGrades = { ...grades.grades };
    if (!value?.trim()) {
      if (newGrades[studentId]) {
        delete newGrades[studentId][typeId];
        if (Object.keys(newGrades[studentId]).length === 0) {
          delete newGrades[studentId];
        }
      }
    } else {
      if (!newGrades[studentId]) newGrades[studentId] = {};
      newGrades[studentId][typeId] = value;
    }
    onGradesChange({
      types: grades.types,
      grades: newGrades,
      comments: grades.comments
    });
    setEditingCell(null);
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
        setAddingType(false);
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
        setDeletingType(null);
        break;
    }
  };

  const renderAddTypeForm = () => (
    <form onSubmit={e => {
      e.preventDefault();
      const formData = new FormData(e.target);
      handleType('add', { label: formData.get('label'), style: 'bg-gray-950/50 text-gray-400' });
    }} className="border border-gray-700 rounded-lg p-4 bg-gray-800/50 mb-4">
      <div className="flex items-center gap-2">
        <input name="label" required className={styles.input + " flex-1 text-right"} placeholder="اسم نوع الواجب الجديد" autoFocus />
        <button type="submit" className={`${styles.button.base} ${styles.button.primary}`}>إضافة</button>
        <button type="button" onClick={() => setAddingType(false)} className={`${styles.button.base} ${styles.button.ghost}`}>إلغاء</button>
      </div>
    </form>
  );

  const renderGradeCell = (student, typeId, currentValue, type) => {
    const isEditing = editingCell?.studentId === student.id && editingCell?.typeId === typeId;
    if (isEditing) {
      return <EditableCell currentValue={currentValue} onSave={(value) => handleGrade(student.id, typeId, value)} onCancel={() => setEditingCell(null)} />;
    }
    return (
      <button onClick={() => setEditingCell({ studentId: student.id, typeId })} className={`w-full px-3 py-1 rounded ${currentValue ? `${type.style} bg-opacity-25 ${!isValidGrade(currentValue) ? 'text-red-400' : ''}` : 'text-gray-500 hover:text-gray-400'}`}>
        {currentValue || 'اضغط لإضافة درجة'}
      </button>
    );
  };

  return (
    <div className="w-full mb-8 border border-gray-800 rounded-lg bg-gray-900/80" dir="rtl">
      <div className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-800/50" onClick={() => setExpanded(!expanded)}>
        <h2 className="text-2xl font-bold text-gray-100">درجات الواجبات السابقة</h2>
        <ChevronDown className={`h-6 w-6 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
      </div>
      {expanded && (
        <div className="p-8 pt-0">
          {addingType ? renderAddTypeForm() : (
            <div className="flex justify-end mb-6">
              <button onClick={() => setAddingType(true)} className={`flex items-center gap-2 ${styles.button.base} ${styles.button.primary}`}>
                <Plus className="h-4 w-4" />إضافة نوع واجب
              </button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="px-4 py-3 bg-gray-800/50 border-b border-gray-700 text-right">الطالب</th>
                  {Object.entries(types).map(([typeId, type]) => (
                    <th key={typeId} className={`px-4 py-3 bg-gray-800/50 border-b border-gray-700 ${type.style}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span>{type.label}</span>
                        {deletingType === typeId ? (
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleType('remove', typeId)} className="p-1 text-red-400 hover:text-red-300"><Check className="h-4 w-4" /></button>
                            <button onClick={() => setDeletingType(null)} className="p-1 text-gray-400 hover:text-gray-300"><X className="h-4 w-4" /></button>
                          </div>
                        ) : (
                          <button onClick={() => setDeletingType(typeId)} className="p-1 hover:bg-red-900/50 rounded"><Trash2 className="h-4 w-4" /></button>
                        )}
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
                          {/* Student name with red if absent, etc. */}
                          <span className={!attendance[student.id]?.present ? 'text-red-400' : 'text-gray-300'}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenCommentStudentId(student.id);
                              }}
                              className="ml-2 text-gray-400 hover:text-gray-200"
                            >
                              {student.name}
                            </button>
                          </span>
                        </td>

                        {/* Render any grade cells */}
                        {Object.entries(types).map(([typeId, type]) => (
                          <td key={typeId} className="px-4 py-3 text-center">
                            {renderGradeCell(student, typeId, grades.grades[student.id]?.[typeId], type)}
                          </td>
                        ))}
                      </tr>

                      {/* A separate row for the comment cell */}
                      {isRowOpen && (
                        <tr>
                          <td colSpan={Object.keys(types).length + 1} className="p-0">
                            <CommentCell
                              studentId={student.id}
                              comment={grades.comments[student.id] || ""}
                              onSaveComment={(sid, newComment) => {
                                handleComment(sid, newComment);
                                // If the new comment is empty, close the row.
                                // If not empty, you can keep it open or close — up to you. 
                                if (!newComment.trim()) {
                                  setOpenCommentStudentId(null);
                                }
                              }}
                              // When user cancels, close the row
                              onCancel={() => setOpenCommentStudentId(null)}
                              placeholder="اكتب ملاحظة حول الطالب..."
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                }
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OldHomeworkGradingSection;