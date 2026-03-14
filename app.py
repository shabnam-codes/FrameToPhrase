from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import torch
import json
import os
import uuid
from caption import caption_image_beam_search

# ── CONFIG ──
BASE_DIR    = r'C:\Users\Shabnam\Desktop\FrameToPhrase\backend'
CHECKPOINT  = os.path.join(BASE_DIR, 'BEST_checkpoint_flickr8k_5_cap_per_img_5_min_word_freq.pth.tar')
WORDMAP     = os.path.join(BASE_DIR, 'WORDMAP_flickr8k_5_cap_per_img_5_min_word_freq.json')
UPLOAD_DIR  = os.path.join(BASE_DIR, 'uploads')
ALLOWED_EXT = {'jpg', 'jpeg', 'png', 'webp', 'gif'}

os.makedirs(UPLOAD_DIR, exist_ok=True)

# ── APP ──
app = Flask(__name__,
            static_folder=BASE_DIR,
            static_url_path='')
CORS(app)

# ── DEVICE & MODEL ──
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f'[FrameToPhrase] Using device: {device}')

checkpoint   = torch.load(CHECKPOINT, map_location=device, weights_only=False)
decoder      = checkpoint['decoder'].to(device).eval()
encoder      = checkpoint['encoder'].to(device).eval()

with open(WORDMAP, 'r') as j:
    word_map = json.load(j)
rev_word_map = {v: k for k, v in word_map.items()}

SKIP_TOKENS = {'<start>', '<end>', '<pad>'}

# ── HELPERS ──
def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXT

# ── ROUTES ──
@app.route('/')
def home():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/caption', methods=['POST'])
def generate_caption():
    # Validate presence
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    file = request.files['image']

    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400

    # Validate type
    if not allowed_file(file.filename):
        return jsonify({'error': f'Unsupported file type. Allowed: {ALLOWED_EXT}'}), 415

    # Save with unique name so concurrent requests don't clash
    ext      = file.filename.rsplit('.', 1)[1].lower()
    tmp_name = f'{uuid.uuid4().hex}.{ext}'
    tmp_path = os.path.join(UPLOAD_DIR, tmp_name)

    try:
        file.save(tmp_path)

        seq, alphas = caption_image_beam_search(
            encoder, decoder, tmp_path, word_map, beam_size=3
        )

        words   = [rev_word_map[ind] for ind in seq]
        caption = ' '.join(w for w in words if w not in SKIP_TOKENS)

        return jsonify({
            'caption':    caption,
            'word_count': len(caption.split())
        })

    except Exception as e:
        print(f'[ERROR] Caption generation failed: {e}')
        return jsonify({'error': 'Caption generation failed. Check server logs.'}), 500

    finally:
        # Always clean up the temp file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)