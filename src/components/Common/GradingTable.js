import React, { useState, useRef } from 'react';
import { Check, X, Trash2, MessageCircle, PenLine, UserX } from 'lucide-react';
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

const CommentCell = ({ studentId, comment, onSaveComment, onCancel, placeholder = "أضف ملاحظة..." }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(comment || "");
  const formRef = useRef(null);

  React.useEffect(() => {
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
      <textarea 
        name="comment" 
        className={styles.input + " flex-1 min-h-[60px] text-sm resize-none"} 
        placeholder={placeholder} 
        autoFocus 
        value={value} 
        onChange={(e) => setValue(e.target.value)} 
      />
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

const GradingTable = ({
  students,
  types,
  grades = {},
  comments = {},
  attendance = {},
  skippedStudents = {},
  onToggleSkip,
  onCommentChange,
  renderGradeCell,
  className = "",
  dir = "rtl",
  emptyMessage = "لا يوجد طلاب"
}) => {
  const [openCommentStudentId, setOpenCommentStudentId] = useState(null);

  // Sort students by attendance if provided
  const sortedStudents = React.useMemo(() => {
    return [...students].sort((a, b) => {
      // First sort by skip status
      if (skippedStudents[a.id] && !skippedStudents[b.id]) return 1;
      if (!skippedStudents[a.id] && skippedStudents[b.id]) return -1;
      
      // Then sort by attendance
      if (!attendance[a.id] || !attendance[b.id]) return 0;
      const aPresent = attendance[a.id]?.present;
      const bPresent = attendance[b.id]?.present;
      if (aPresent === bPresent) return 0;
      return aPresent ? -1 : 1;
    });
  }, [students, attendance, skippedStudents]);

  const handleComment = (studentId, newComment) => {
    const trimmed = (newComment || "").trim();
    onCommentChange?.(studentId, trimmed);
  };

  if (!students.length) {
    return <div className="text-center p-8 text-gray-500">{emptyMessage}</div>;
  }

  return (
    <div className={`w-full border border-gray-800 rounded-lg bg-gray-900/80 ${className}`} dir={dir}>
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
                  <th 
                    key={typeId} 
                    className={`px-4 py-3 bg-gray-800/50 border-b border-gray-700 ${type.style || ''}`}
                  >
                    <div className="items-center justify-between gap-2">
                      <span>{type.label}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedStudents.map((student) => {
                const hasComment = Boolean(comments[student.id]);
                const isRowOpen = hasComment || openCommentStudentId === student.id;
                const isPresent = attendance[student.id]?.present;
                const isSkipped = skippedStudents[student.id];

                return (
                  <React.Fragment key={student.id}>
                    <tr 
                      className={`border-b border-gray-800 last:border-0 hover:bg-gray-800/30 
                                ${isSkipped ? 'bg-gray-800/10 text-gray-500' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {attendance[student.id] && (
                            isPresent ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <X className="h-4 w-4 text-red-500" />
                            )
                          )}
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (openCommentStudentId === student.id) {
                                setOpenCommentStudentId(null);
                              } else {
                                setOpenCommentStudentId(student.id);
                              }
                            }}
                            className={`${styles.button.ghost} 
                              ${isSkipped ? 'line-through text-gray-500' : 
                                (!isPresent && attendance[student.id]) ? 'text-red-500 hover:text-red-300' : 
                                'text-gray-300 hover:text-gray-100'}`}
                          >
                            {student.name}
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleSkip?.(student.id);
                            }}
                            className={`p-1 rounded-md transition-colors ml-1 ${
                              isSkipped ? 
                              'bg-gray-700/50 text-gray-400 hover:bg-gray-700' : 
                              'text-gray-500 hover:bg-gray-800 hover:text-red-400'
                            }`}
                            title={isSkipped ? "إلغاء التخطي" : "تخطي هذا الطالب"}
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      
                      {Object.entries(types).map(([typeId, type]) => (
                        <td key={typeId} className={`px-4 py-3 text-center ${isSkipped ? 'line-through' : ''}`}>
                          {renderGradeCell(student, typeId, grades[student.id]?.[typeId], type)}
                        </td>
                      ))}
                    </tr>
                    {onCommentChange && isRowOpen && !isSkipped && (
                      <tr>
                        <td colSpan={Object.keys(types).length + 1} className="p-0">
                          <CommentCell
                            studentId={student.id}
                            comment={comments[student.id] || ""}
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

export default GradingTable;
