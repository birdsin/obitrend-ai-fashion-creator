const $ = (id) => document.getElementById(id);
let resultUrl = null;

document.addEventListener("DOMContentLoaded", () => {
  const garment = $("garment");
  const generate = $("generate");
  const preview = $("preview");
  const fileLabel = $("fileLabel");
  const canvas = $("canvas");
  const download = $("download");
  const status = $("status");

  if (!garment) {
    console.error("OBITREND: garment input not found");
    return;
  }

  if (!generate) {
    console.error("OBITREND: generate button not found");
    return;
  }

  garment.addEventListener("change", () => {
    const file = garment.files && garment.files[0];

    if (!file) return;

    if (fileLabel) {
      fileLabel.textContent = file.name;
    }

    if (preview) {
      preview.src = URL.createObjectURL(file);
      preview.classList.remove("preview-hidden");
    }

    if (status) {
      status.textContent = "• Photo uploaded";
    }
  });

  generate.addEventListener("click", async (event) => {
    event.preventDefault();

    console.log("OBITREND: Generate clicked");

    const file = garment.files && garment.files[0];

    if (!file) {
      alert("Upload a clothing photo first.");
      return;
    }

    const form = new FormData();

    form.append("garment", file);

    ["model", "background", "pose", "style", "extra"].forEach((id) => {
      const element = $(id);

      if (element) {
        form.append(id, element.value || "");
      }
    });

    generate.disabled = true;

    if (download) {
      download.disabled = true;
    }

    if (status) {
      status.textContent = "• Generating...";
    }

    if (canvas) {
      canvas.innerHTML = `
        <div class="spinner"></div>
        <p>Creating your fashion campaign...</p>
      `;
    }

    try {
      console.log("OBITREND: Sending request to /api/generate");

      const response = await fetch("/api/generate", {
        method: "POST",
        body: form
      });

      console.log("OBITREND: Server response", response.status);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation failed.");
      }

      if (!data.image) {
        throw new Error("Server returned no image.");
      }

      resultUrl = data.image;

      if (canvas) {
        canvas.innerHTML = `
          <img
            src="${resultUrl}"
            alt="Generated OBITREND fashion campaign"
            style="width:100%;height:auto;display:block;border-radius:16px;"
          >
        `;
      }

      if (download) {
        download.disabled = false;
      }

      if (status) {
        status.textContent = "• Image ready";
      }

    } catch (error) {
      console.error("OBITREND generation error:", error);

      if (canvas) {
        canvas.innerHTML = `
          <div>
            <h3>Generation failed</h3>
            <p>${escapeHtml(error.message)}</p>
          </div>
        `;
      }

      if (status) {
        status.textContent = "• Error";
      }

    } finally {
      generate.disabled = false;
    }
  });

  if (download) {
    download.addEventListener("click", () => {
      if (!resultUrl) return;

      const a = document.createElement("a");
      a.href = resultUrl;
      a.download = "obitrend-fashion-campaign.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
  }
});

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}
