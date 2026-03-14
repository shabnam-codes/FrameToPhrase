// ── ELEMENTS ──
// ── ELEMENTS ──
const dropZone      = document.getElementById('dropZone');
const dropIdle      = document.getElementById('dropIdle');
const dropLoading   = document.getElementById('dropLoading');
const previewImg    = document.getElementById('previewImg');
const fileInput     = document.getElementById('fileInput');

const fileStrip     = document.getElementById('fileStrip');
const fileName      = document.getElementById('fileName');
const fileBarFill   = document.getElementById('fileBarFill');
const filePct       = document.getElementById('filePct');

const resultIdle    = document.getElementById('resultIdle');
const resultLoading = document.getElementById('resultLoading');
const resultOutput  = document.getElementById('resultOutput');
const captionText   = document.getElementById('captionText');

const ACCEPTED = ['jpeg', 'jpg', 'png', 'webp', 'gif', 'svg'];

// ── STATE HELPERS ──
function showState(state) {
  // upload panel
  dropIdle.style.display    = state === 'idle'    ? 'flex' : 'none';
  dropLoading.classList.toggle('visible', state === 'loading');
  if (state !== 'preview' && state !== 'loading') {
    previewImg.classList.remove('visible');
  }

  // result panel
  resultIdle.style.display    = state === 'idle'           ? 'flex' : 'none';
  resultLoading.classList.toggle('visible', state === 'captioning');
  resultOutput.classList.toggle('visible',  state === 'done' || state === 'error');
  resultOutput.classList.toggle('error',    state === 'error');
}

showState('idle');

// ── DRAG & DROP ──
dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  dropZone.classList.add('over');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('over');
});

dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('over');
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});

// ── HANDLE FILE ──
function handleFile(file) {
  if (!validate(file)) return;

  showState('loading');
  fileStrip.classList.remove('visible');

  const reader = new FileReader();

  reader.onload = () => {
    previewImg.src = reader.result;

    previewImg.onload = () => {
      // Show preview
      dropLoading.classList.remove('visible');
      previewImg.classList.add('visible');
      dropIdle.style.display = 'none';

      // File strip
      const shortName = file.name.length > 22 ? file.name.slice(0, 22) + '…' : file.name;
      fileName.textContent = shortName;
      fileStrip.classList.add('visible');
      animateBar();

      // Caption
      showState('captioning');
      generateCaption(file);
    };
  };

  reader.readAsDataURL(file);
}

// ── VALIDATE ──
function validate(file) {
  const ext = file.type.split('/')[1];
  if (!ACCEPTED.includes(ext)) {
    alert('Please upload an image file (JPG, PNG, WEBP, GIF, SVG).');
    return false;
  }
  if (file.size > 2_000_000) {
    alert('File must be 2 MB or less.');
    return false;
  }
  return true;
}

// ── PROGRESS BAR ──
function animateBar() {
  filePct.textContent = '0%';
  fileBarFill.style.width = '0%';
  let pct = 0;
  const iv = setInterval(() => {
    pct += 10;
    fileBarFill.style.width = pct + '%';
    filePct.textContent = pct + '%';
    if (pct >= 100) clearInterval(iv);
  }, 80);
}

// ── GENERATE CAPTION ──
async function generateCaption(imageFile) {
  const formData = new FormData();
  formData.append('image', imageFile);

  try {
    const res  = await fetch('http://127.0.0.1:5000/caption', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    showCaption(data.caption);
  } catch (err) {
    showError('Could not reach the server. Make sure Flask is running on port 5000.');
    console.error('Flask error:', err);
  }
}

// ── SHOW CAPTION ──
function showCaption(text) {
  captionText.textContent = text;
  showState('done');
}

function showError(msg) {
  captionText.textContent = msg;
  showState('error');
}