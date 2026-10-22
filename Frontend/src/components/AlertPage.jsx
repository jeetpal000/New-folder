import React from "react";

const AlertPage = ({
  title,
  description,
  setShowAlertPage,
  id,
  handleDeleteSubject,
}) => {
  return (
    <div className="bg-(--primary-soft)/10 backdrop-blur-2xl border border-(--danger)/50 rounded-xl hover:shadow-2xl p-5 hover:border(--danger)">
      <h2 className="text-lg font-bold ">{title}</h2>
      <p className="mt-3 pl-5 text-sm text-white">{description}</p>

      <div className="mt-5 flex justify-end gap-3">
        <button
          className="border border-(--border) text-(--text) px-4 py-2 rounded-xl bg-(--surface)/60 hover:bg-(--surface) font-semibold hover:border-(--border)  transition-all duration-200 cursor-pointer hover:-translate-y-1 active:scale(95)"
          onClick={() => setShowAlertPage(false)}
        >
          cancel
        </button>
        <button
          className="border border-(--danger) text-(--surface)/70 px-4 py-2 rounded-xl bg-(--danger)/40 hover:bg-(--danger) font-semibold hover:border-(--danger) hover:text-(--surface) transition-all duration-200 cursor-pointer hover:-translate-y-1 active:scale(95)"
          onClick={() => {
            handleDeleteSubject(id);
            setShowAlertPage(false);
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default AlertPage;
