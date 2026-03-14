# FrameToPhrase
FrameToPhrase is a deep learning image captioning system built as part of an academic project. It takes any image as input and generates a natural language description of what it sees.

## Technologies
**Deep Learning & Backend**
Python
PyTorch
Flask

**Frontend**
HTML5
CSS3
JavaScript

**Dataset & Evaluation**
- Flickr8k — 8,000 images, 5 reference captions each
- BLEU-4 score (bilingual evaluation understudy)

## The Process

**1. Preprocessing**
The Flickr8k dataset was processed using `create_input_files.py`, which builds an HDF5 file of encoded images and a JSON word map, filtering to words that appear at least 5 times across the corpus (minimum word frequency = 5, 5 captions per image).

**2. Model Architecture — Show, Attend and Tell**
```
Image ──► ResNet-101 Encoder ──► 14×14×2048 Feature Map
                                          │
                              Soft Bahdanau Attention ◄── LSTM hidden state
                                          │
                                   Context Vector
                                          │
                              LSTM Decoder ──► token by token ──► Caption
```
**3. Training**
| Hyperparameter | Value |
|----------------|-------|
| Batch size | 32 |
| Epochs | 10 |
| Encoder learning rate | 1e-4 |
| Decoder learning rate | 4e-4 |
| Gradient clipping | 5.0 |
| Beam size (eval) | 3 |

The best checkpoint was saved based on BLEU-4 score on the validation split.

**4. Evaluation**
`eval.py` runs beam search over the Flickr8k test split and computes corpus-level BLEU scores against all 5 reference captions per image.

| Metric | Score |
|--------|-------|
| BLEU-4 | ** ** |

## What I Learned

Building FrameToPhrase from scratch meant touching every layer of a machine learning project at once, which surfaced lessons that wouldn't come from just running someone else's notebook.

**Attention is interpretable, not just effective.** Visualising where the model attends at each decoding step made the architecture feel tangible — it's genuinely looking at the dog when it says *"dog"*, and at the water when it says *"swimming"*. That made the theory click in a way that reading the paper alone didn't.

**BLEU is a floor, not a ceiling.** A score of 0.2209 is competitive for this dataset and architecture, but BLEU only rewards n-gram overlap with reference captions. A caption can be semantically accurate and score poorly if it uses different but valid words. Evaluation metrics in NLP are an active research problem, not a solved one.

**Backend robustness matters more than it seems.** The first version of `app.py` saved every upload as the same `temp_image.jpg`. That's fine when testing alone — and completely broken under any real load. Adding UUID filenames, a `finally` cleanup block, file type validation, and proper error responses turned a fragile script into something that could actually run.

**Frontend and model work must talk to each other.** Designing the trial page required thinking about latency — the model takes a moment to run, so the UI needed clear loading states so the experience didn't feel broken. State management in vanilla JS (idle → loading → result → error) taught more about UX than any tutorial.

---

## Preview


To run it locally:

```bash
pip install flask flask-cors torch torchvision pillow

Set BASE_DIR in backend/app.py to your local backend/ path

cd backend
python app.py

```

---
## References

- Xu et al. (2015) — [Show, Attend and Tell: Neural Image Caption Generation with Visual Attention](https://arxiv.org/abs/1502.03044)
- He et al. (2016) — [Deep Residual Learning for Image Recognition](https://arxiv.org/abs/1512.03385)
- Hodosh et al. (2013) — [Framing Image Description as a Ranking Task](https://jair.org/index.php/jair/article/view/10833) *(Flickr8k)*
- Papineni et al. (2002) — [BLEU: a Method for Automatic Evaluation of Machine Translation](https://aclanthology.org/P02-1040/)
