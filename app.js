document.addEventListener("DOMContentLoaded", () => {
      const garment = document.getElementById("garment");
        const preview = document.getElementById("preview");

          if (!garment) {
              console.error("OBITREND: garment input not found");
                  return;
                    }

                      garment.addEventListener("change", (event) => {
                          const file = event.target.files[0];

                              if (!file) {
                                    return;
                                        }

                                            console.log("OBITREND: Photo selected:", file.name);

                                                if (!file.type.startsWith("image/")) {
                                                      alert("Please select a JPG, PNG, or WEBP image.");
                                                            return;
                                                                }

                                                                    if (file.size > 12 * 1024 * 1024) {
                                                                          alert("Image must be smaller than 12 MB.");
                                                                                return;
                                                                                    }

                                                                                        const imageURL = URL.createObjectURL(file);

                                                                                            preview.src = imageURL;
                                                                                                preview.style.display = "block";
                                                                                                    preview.hidden = false;

                                                                                                        preview.onload = () => {
                                                                                                              URL.revokeObjectURL(imageURL);
                                                                                                                  };
                                                                                                                    });
                                                                                                                    });
const generateBtn = document.getElementById("generateBtn");

generateBtn.addEventListener("click", async () => {
  const garment = document.getElementById("garment");

    if (!garment || !garment.files || !garment.files[0]) {
        alert("Please upload a clothing image first.");
            return;
              }

                const file = garment.files[0];

                const formData = new FormData();
                formData.append("garment", file);
                formData.append("model", "realistic fashion model");
                        formData.append("background", "luxury fashion studio");
                          formData.append("pose", "standing naturally");
                            formData.append("style", "professional fashion campaign");
                              formData.append("extra", "Preserve the exact garment design, color, shape, stitching and details.");

                                generateBtn.disabled = true;
                                  generateBtn.textContent = "Generating...";

                                    try {
                                        const response = await fetch("/api/generate", {
                                              method: "POST",
                                                    body: formData
                                                        });

                                                            const data = await response.json();

                                                                if (!response.ok) {
                                                                      throw new Error(data.error || "Image generation failed.");
                                                                          }

const preview = document.getElementById("preview");

if (data.image) {
  preview.src = data.image;
    preview.style.display = "block";

      // Create download button
        let downloadBtn = document.getElementById("downloadBtn");

          if (!downloadBtn) {
              downloadBtn = document.createElement("a");
                  downloadBtn.id = "downloadBtn";
                  downloadBtn.textContent = "Download Image";
                  downloadBtn.download = "OBITREND-fashion-creator.png";

downloadBtn.style.display = "block";
downloadBtn.style.marginTop = "18px";
downloadBtn.style.textAlign = "center";
downloadBtn.style.padding = "14px 24px";
downloadBtn.style.borderRadius = "12px";
downloadBtn.style.textDecoration = "none";
downloadBtn.style.fontSize = "16px";
downloadBtn.style.fontWeight = "600";
downloadBtn.style.background = "#111111";
downloadBtn.style.color = "#ffffff";
downloadBtn.style.boxShadow = "0 4px 12px rgba(0,0,0,0.18)";
downloadBtn.style.cursor = "pointer";
downloadBtn.style.transition = "0.2s";


                                                          preview.parentElement.appendChild(downloadBtn);
                                                            }

                                                              downloadBtn.href = data.image;

                                                              } else if (data.b64_json) {

                                                                const imageData = "data:image/png;base64," + data.b64_json;

                                                                  preview.src = imageData;
                                                                    preview.style.display = "block";

                                                                      let downloadBtn = document.getElementById("downloadBtn");

                                                                        if (!downloadBtn) {
                                                                            downloadBtn = document.createElement("a");
                                                                                downloadBtn.id = "downloadBtn";
                                                                                    downloadBtn.textContent = "Download Image";
                                                                                        downloadBtn.download = "obitrend-fashion-image.png";

                                                                                            downloadBtn.style.display = "block";
                                                                                                downloadBtn.style.marginTop = "15px";
                                                                                                    downloadBtn.style.textAlign = "center";
                                                                                                        downloadBtn.style.padding = "12px";
                                                                                                            downloadBtn.style.borderRadius = "10px";
                                                                                                                downloadBtn.style.textDecoration = "none";
                                                                                                                    downloadBtn.style.cursor = "pointer";

                                                                                                                        preview.parentElement.appendChild(downloadBtn);
                                                                                                                          }

                                                                                                                            downloadBtn.href = imageData;

                                                                                                                            } else {
                                                                                                                              throw new Error("No generated image was returned.");
                                                                                                                              }
                                                                                                                              } catch (error) {
                                                                                                                                  console.error(error);
                                                                                                                                      alert("Generation failed: " + error.message);
                                                                                                                                        } finally {
                                                                                                                                            generateBtn.disabled = false;
                                                                                                                                                generateBtn.textContent = "Generate Fashion";
                                                                                                                                                  }
                                                                                                                                                  });