// AddExpense.jsx
import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import apiCall from "../../services/ApiCallGeneric/apiCall";
import AuthContext from "../../services/Authentication/AuthContext";
import jsQR from "jsqr";

function AddExpense() {
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    value: "",
    payAmount: "",
    startDate: new Date().toISOString().split("T")[0],
    periodicity: "OneTime",
    endDate: "",
    repeatCount: "1",
    shouldNotify: true,
    category: "",
    isTotalValue: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [parcelValue, setParcelValue] = useState("0.00");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiCall.get(
          `/Categories/GetCategoriesByType?type=Expense`
        );
        const data = res.data;
        const parsedCategories = Array.isArray(data)
          ? data
          : data?.$values || [];
        setCategories(parsedCategories);
      } catch (error) {
        console.error("Erro ao buscar categorias:", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const isValidDate = (dateStr) => {
      const date = new Date(dateStr);
      return !isNaN(date.getTime());
    };

    if (
      formData.periodicity !== "Endless" &&
      formData.periodicity !== "OneTime" &&
      isValidDate(formData.startDate) &&
      formData.repeatCount &&
      !isNaN(parseInt(formData.repeatCount))
    ) {
      const start = new Date(formData.startDate);
      const repeat = parseInt(formData.repeatCount);
      const end = new Date(start);

      switch (formData.periodicity) {
        case "Daily":
          end.setDate(start.getDate() + repeat);
          break;
        case "Weekly":
          end.setDate(start.getDate() + 7 * repeat);
          break;
        case "Monthly":
          end.setMonth(start.getMonth() + repeat);
          break;
        case "Yearly":
          end.setFullYear(start.getFullYear() + repeat);
          break;
        default:
          break;
      }

      setFormData((prev) => ({
        ...prev,
        endDate: end.toISOString().split("T")[0],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        repeatCount: "",
        endDate: "",
      }));
    }
  }, [formData.periodicity, formData.startDate, formData.repeatCount]);

  useEffect(() => {
    const total = parseFloat(formData.value || 0);
    const paid = parseFloat(formData.payAmount || 0);
    const count =
      formData.periodicity === "Endless"
        ? 1
        : parseInt(formData.repeatCount || "1");

    let value = "0.00";
    if (formData.isTotalValue) {
      const remaining = Math.max(0, total - paid);
      value = count > 0 ? (remaining / count).toFixed(2) : "0.00";
    } else {
      value = total.toFixed(2);
    }
    setParcelValue(value);
  }, [
    formData.value,
    formData.payAmount,
    formData.repeatCount,
    formData.isTotalValue,
    formData.periodicity,
  ]);

  const handleImageUpload = (file, isQrCode) => {
    if (!file) return;
    if (!isQrCode) {
      setImageFile(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
      const image = new Image();
      image.onload = function () {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, canvas.width, canvas.height);
        if (code) {
          try {
            const parsed = JSON.parse(code.data);
            setFormData((prev) => ({
              ...prev,
              ...parsed,
            }));
          } catch (err) {
            console.warn("Erro ao analisar QR Code:", err);
          }
        } else {
        }
      };
      image.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = new FormData();

    const request = {
      name: formData.name,
      description: formData.description,
      value: parseFloat(formData.value),
      payAmount: parseFloat(formData.payAmount || 0),
      startDate: formData.startDate,
      endDate: formData.endDate || "",
      repeatCount: formData.repeatCount,
      shouldNotify: formData.shouldNotify,
      periodicity: formData.periodicity,
      category: formData.category,
      userEmail: auth?.email || "",
      isTotalValue: formData.isTotalValue,
    };

    Object.entries(request).forEach(([key, value]) => {
      payload.append(`request.${key}`, value);
    });

    if (imageFile) {
      payload.append("uploadType", "File");
      payload.append("image", imageFile);
    }

    try {
      await apiCall.post("/Expenses/CreateExpensesWithImage", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate("/expenses");
    } catch (err) {
      console.error("Erro ao criar despesa:", err);
    }
  };

  const showValueType =
    formData.periodicity !== "OneTime" && formData.periodicity !== "Endless";
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Criar Despesa</h1>
      </div>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white p-4 rounded shadow"
      >
        <div>
          <label className="block text-sm font-medium">Nome *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Descrição</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Categoria *</label>
          <select
            required
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            className="w-full border p-2 rounded"
          >
            <option value="">Selecione uma categoria</option>
            {categories.map((cat) => (
              <option key={cat.Id} value={cat.Name}>
                {cat.Name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Valor (€)</label>
            <input
              type="number"
              step="0.01"
              value={formData.value}
              onChange={(e) =>
                setFormData({ ...formData, value: e.target.value })
              }
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Valor Pago (€)</label>
            <input
              type="number"
              step="0.01"
              value={formData.payAmount}
              onChange={(e) =>
                setFormData({ ...formData, payAmount: e.target.value })
              }
              className="w-full border p-2 rounded"
            />
            {showValueType && (
              <div>
                <label className="block text-sm font-medium">
                  Tipo de valor
                </label>
                <select
                  value={formData.isTotalValue ? "total" : "parcelas"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isTotalValue: e.target.value === "total",
                    })
                  }
                  className="w-full border p-2 rounded"
                >
                  <option value="total">Total</option>
                  <option value="parcelas">Por parcelas</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Periodicidade</label>
            <select
              value={formData.periodicity}
              onChange={(e) =>
                setFormData({ ...formData, periodicity: e.target.value })
              }
              className="w-full border p-2 rounded"
            >
              <option value="OneTime">Única</option>
              <option value="Daily">Diária</option>
              <option value="Weekly">Semanal</option>
              <option value="Monthly">Mensal</option>
              <option value="Yearly">Anual</option>
              <option value="Endless">Sem Fim</option>
            </select>
          </div>

          {formData.periodicity !== "OneTime" &&
            formData.periodicity !== "Endless" && (
              <div>
                <label className="block text-sm font-medium">Repetições</label>
                <input
                  type="number"
                  min="1"
                  value={formData.repeatCount}
                  onChange={(e) =>
                    setFormData({ ...formData, repeatCount: e.target.value })
                  }
                  className="w-full border p-2 rounded"
                />
              </div>
            )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Data de Início</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              className="w-full border p-2 rounded"
            />
          </div>

          {showValueType && (
            <div>
              <label className="block text-sm font-medium">Data de Fim</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="w-full border p-2 rounded"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Valor por parcela</label>
          <input
            type="text"
            value={`€${parcelValue}`}
            disabled
            className="w-full border p-2 rounded bg-gray-100 text-gray-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Imagem (Guardar)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e.target.files[0], false)}
            className="w-full border p-2 rounded"
          />
        </div>

        {formData.periodicity === "OneTime" && (
          <div>
            <label className="block text-sm font-medium">
              Imagem (QR Code)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e.target.files[0], true)}
              className="w-full border p-2 rounded"
            />
          </div>
        )}

        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Criar Despesa
        </button>
      </form>
    </div>
  );
}

export default AddExpense;
