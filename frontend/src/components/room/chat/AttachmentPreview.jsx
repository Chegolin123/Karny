// C:\OSPanel\domains\karny\frontend\src\components\room\chat\AttachmentPreview.jsx

export default function AttachmentPreview({ attachments, onRemove, darkMode }) {
  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {attachments.map((file, index) => (
        <div key={index} className="relative group">
          {file.type?.startsWith('image/') ? (
            <img
              src={file.preview || file.url}
              alt={file.name}
              className="w-20 h-20 object-cover rounded-lg"
            />
          ) : (
            <div className={`w-20 h-20 rounded-lg flex items-center justify-center ${
              darkMode ? 'bg-[#2a2a30]' : 'bg-gray-100'
            }`}>
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          )}
          <button
            onClick={() => onRemove(index)}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}