import React, { useState, useEffect } from "react";
import apiCall from "../../services/apiCall";

function AttachImageToInstance({ instanceId, onImageAttached }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageId, setImageId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchImageInfo = async () => {
      try {
        const res = await apiCall.get(
          `ImagesBd/GetByInstanceId?instanceId=${instanceId}`
        );
        if (res.data?.imageUrl && res.data?.id) {
          setPreviewUrl(res.data.imageUrl);
          setImageId(res.data.id);
        }
      } catch (err) {
        console.warn("No image found for instance:", instanceId);
      }
    };
    fetchImageInfo();
  }, [instanceId]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadRes = await apiCall.post("ImagesBd/Upload", formData);
      const newImageId = uploadRes.data.id;

      await apiCall.post(
        `Expenses/AttachImageToInstance?instanceId=${instanceId}&imageId=${newImageId}`
      );
      setImageId(newImageId);
      setPreviewUrl(URL.createObjectURL(file));
      onImageAttached(newImageId);
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  const handleRemove = async () => {
    try {
      await apiCall.post(
        `Expenses/RemoveImageFromInstance?instanceId=${instanceId}`
      );
      setPreviewUrl(null);
      setImageId(null);
    } catch (err) {
      console.error("Failed to remove image:", err);
    }
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = "receipt.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {previewUrl ? (
        <>
          <img
            src={previewUrl}
            alt="Receipt"
            className="w-32 h-32 object-cover rounded shadow cursor-pointer"
            onClick={() => setShowModal(true)}
          />
          <div className="flex gap-3 text-sm">
            <button
              onClick={handleDownload}
              className="text-blue-600 hover:underline"
            >
              Download
            </button>
            <button
              onClick={handleRemove}
              className="text-red-600 hover:underline"
            >
              Remove
            </button>
          </div>

          {/* Modal */}
          {showModal && (
            <div
              className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
              onClick={() => setShowModal(false)}
            >
              <img
                src={previewUrl}
                alt="Full Receipt"
                className="max-w-[90%] max-h-[90%] border rounded shadow-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </>
      ) : (
        <label className="text-sm text-blue-600 cursor-pointer hover:underline">
          Attach Image
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}

export default AttachImageToInstance;
