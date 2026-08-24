function setStatus(elementId, message, isError = false) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = message;
    el.classList.toggle("error", isError);
    el.classList.toggle("success", !isError && Boolean(message));
}

function downloadBlob(filename, blobParts, mimeType) {
    const blob = new Blob(blobParts, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
}

function csvEscape(value) {
    const str = String(value ?? "");
    if (/[",\n]/.test(str)) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

function pickupsToCsv(pickups) {
    const header = ["horario", "email", "userId", "session", "recall"];
    const lines = [header.join(",")];
    for (const pickup of pickups) {
        lines.push(header.map((field) => csvEscape(pickup[field])).join(","));
    }
    return lines.join("\n");
}

// horario vem em horário de Brasília (naive, ex.: "2026-07-31T15:59:14").
// Formata como dd/mm/aaaa hh:mm sem aplicar conversão de fuso.
function formatHorario(isoNaive) {
    if (!isoNaive) return "";
    const [datePart, timePart] = String(isoNaive).split("T");
    if (!timePart) return isoNaive;
    const [year, month, day] = datePart.split("-");
    const [hour, minute] = timePart.split(":");
    return `${day}/${month}/${year} ${hour}:${minute}`;
}

// Nome do arquivo com o datetime atual em UTC-3: dd_mm_aaaa_hh_mm.
function buildCsvFilename() {
    const brt = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const dd = String(brt.getUTCDate()).padStart(2, "0");
    const mm = String(brt.getUTCMonth() + 1).padStart(2, "0");
    const aaaa = brt.getUTCFullYear();
    const hh = String(brt.getUTCHours()).padStart(2, "0");
    const min = String(brt.getUTCMinutes()).padStart(2, "0");
    return `retiradas_${dd}_${mm}_${aaaa}_${hh}_${min}.csv`;
}

// --- Menu ---

const menuButtons = document.getElementById("btnMenuKeys") && document.getElementById("btnMenuDecrypt");

function showTab(tabId, buttonId) {
    for (const tab of document.querySelectorAll(".tab")) {
        tab.classList.remove("active");
    }
    for (const button of document.querySelectorAll(".menu-button")) {
        button.classList.remove("active");
    }
    document.getElementById(tabId).classList.add("active");
    document.getElementById(buttonId).classList.add("active");
}

if (menuButtons) {
    document.getElementById("btnMenuKeys").addEventListener("click", () => showTab("tabKeys", "btnMenuKeys"));
    document.getElementById("btnMenuDecrypt").addEventListener("click", () => showTab("tabDecrypt", "btnMenuDecrypt"));
    showTab("tabKeys", "btnMenuKeys");
}

// --- Gerar chaves ---

const btnGenerateKeys = document.getElementById("btnGenerateKeys");
if (btnGenerateKeys) {
    btnGenerateKeys.addEventListener("click", async () => {
        try {
            const keyPair = await dbGenerateRSAKeys();
            downloadBlob("public_key.pem", [keyPair.publicKey], "application/x-pem-file");
            downloadBlob("private_key.pem", [keyPair.privateKey], "application/x-pem-file");
            setStatus("keysStatus", "Par de chaves gerado e baixado (public_key.pem e private_key.pem).");
        } catch (error) {
            setStatus("keysStatus", "Erro ao gerar chaves: " + error.message, true);
        }
    });
}

// --- Descriptografar dados ---

let loadedPrivateKeyPem = null;

const privateKeyDropZone = document.getElementById("privateKeyDropZone");
const privateKeyFileInput = document.getElementById("privateKeyFile");

async function loadPrivateKeyFile(file) {
    if (!file) return;
    loadedPrivateKeyPem = await readFileAsText(file);
    setStatus("privateKeyStatus", "Arquivo carregado: " + file.name);
}

if (privateKeyDropZone) {
    privateKeyDropZone.addEventListener("click", () => privateKeyFileInput.click());

    privateKeyDropZone.addEventListener("dragover", (event) => {
        event.preventDefault();
        privateKeyDropZone.classList.add("drag-over");
    });

    privateKeyDropZone.addEventListener("dragleave", () => {
        privateKeyDropZone.classList.remove("drag-over");
    });

    privateKeyDropZone.addEventListener("drop", async (event) => {
        event.preventDefault();
        privateKeyDropZone.classList.remove("drag-over");
        await loadPrivateKeyFile(event.dataTransfer.files[0]);
    });

    privateKeyFileInput.addEventListener("change", async (event) => {
        await loadPrivateKeyFile(event.target.files[0]);
    });
}

const btnDownloadDecryptedCsv = document.getElementById("btnDownloadDecryptedCsv");
if (btnDownloadDecryptedCsv) {
    btnDownloadDecryptedCsv.addEventListener("click", async () => {
        if (!loadedPrivateKeyPem) {
            setStatus("decryptStatus", "Carregue a chave privada antes de continuar.", true);
            return;
        }

        try {
            const response = await fetch("/decrypt/data");
            if (!response.ok) {
                throw new Error("HTTP " + response.status);
            }
            const pickups = await response.json();

            const decryptField = async (value) => {
                if (!value) return "";
                try {
                    return await dbDecryptString(value, loadedPrivateKeyPem);
                } catch (error) {
                    // Nem todo registro está criptografado — se não der pra
                    // descriptografar, mantém o valor como veio.
                    return value;
                }
            };

            const decryptedPickups = [];
            for (const pickup of pickups) {
                decryptedPickups.push({
                    horario: formatHorario(pickup.horario),
                    email: await decryptField(pickup.email),
                    userId: pickup.userId ?? "",
                    session: pickup.session ?? "",
                    recall: pickup.recall ? "sim" : "não",
                });
            }

            downloadBlob(buildCsvFilename(), [pickupsToCsv(decryptedPickups)], "text/csv");
            setStatus("decryptStatus", "CSV descriptografado baixado.");
        } catch (error) {
            setStatus("decryptStatus", "Erro ao descriptografar dados: " + error.message, true);
        }
    });
}
