# Open-source libraries and resources used

Every library, model, dataset, design source and data source used by ZeroScam, with its official link.
Versions are the ones installed in IBM's LinuxONE image (Python side) and in `web/package-lock.json` (web side).

## IBM LinuxONE platform

| Name | What we use it for | Link |
|---|---|---|
| IBM LinuxONE Community Cloud | The s390x virtual machine everything runs on | https://linuxone.cloud.marist.edu/ |
| LinuxONE Community Cloud documentation | Setting up and using the VM | https://ibm.biz/BdPcL8 |
| IBM `jupyter-lab-ml` (image, labs, package list) | Docker image with Jupyter + Python libraries; Lab 01 and Lab 02 | https://github.com/linuxone-community-cloud/jupyter-lab-ml |
| IBM `jupyterlab-image-s390x` container image | The container our notebook and API run in | `registry.linuxone.cloud.marist.edu/l1cc/jupyterlab-image-s390x:latest` |
| Ubuntu 24.04 | VM operating system | https://ubuntu.com/ |
| Docker | Runs the IBM container on the VM | https://www.docker.com/ |

## AI model and inference

| Name | What we use it for | Licence | Link |
|---|---|---|---|
| IBM Granite 4.0 H 350M Base | Plain-language explanation of each verdict (big-endian GGUF file supplied in IBM's image) | Apache-2.0 | https://huggingface.co/ibm-granite/granite-4.0-h-350m-base |
| llama-cpp-python 0.3.36 | Runs Granite from Python | MIT | https://github.com/abetlen/llama-cpp-python |
| llama.cpp | Inference engine under llama-cpp-python | MIT | https://github.com/ggml-org/llama.cpp |

## Python (model training, checker, API)

| Name | What we use it for | Licence | Link |
|---|---|---|---|
| Python 3.12 | Language of the checker, notebook and API | PSF | https://www.python.org/ |
| Jupyter (JupyterLab 4.6.4, Notebook 7.6.3) | Training notebook on LinuxONE | BSD-3-Clause | https://jupyter.org/ |
| pandas 3.0.6 | Loading and exploring the dataset | BSD-3-Clause | https://pandas.pydata.org/ |
| NumPy 2.0.2 | Numbers under pandas and scikit-learn | BSD-3-Clause | https://numpy.org/ |
| scikit-learn 1.9.0 | TF-IDF, logistic regression, Naive Bayes, metrics | BSD-3-Clause | https://scikit-learn.org/ |
| joblib 1.6.0 | Saving and loading the trained model | BSD-3-Clause | https://joblib.readthedocs.io/ |
| matplotlib 3.11.2 | Charts and confusion matrices in the notebook | PSF-based (matplotlib licence) | https://matplotlib.org/ |
| Flask 3.1.3 | Web API and serving the UI | BSD-3-Clause | https://flask.palletsprojects.com/ |

## Dataset

| Name | What we use it for | Licence | Link |
|---|---|---|---|
| SMS Spam Collection (Tiago A. Almeida, José María Gómez Hidalgo), UCI Machine Learning Repository, DOI 10.24432/C5CC84 | Training and testing the word model | CC BY 4.0 | https://archive.ics.uci.edu/dataset/228/sms+spam+collection |

Scam-tactic phrases (English + Malay), link lists and the 22 test messages were created by the team with AI
assistance during the event.

## Web UI libraries

| Name | What we use it for | Licence | Link |
|---|---|---|---|
| Node.js + npm | Building the UI on the developer's machine (not needed on the VM) | MIT | https://nodejs.org/ |
| React 19 + React DOM | UI framework | MIT | https://react.dev/ |
| Vite 8 | Build tool and dev server | MIT | https://vite.dev/ |
| @vitejs/plugin-react | React support for Vite | MIT | https://github.com/vitejs/vite-plugin-react |
| TypeScript 6 | Typed JavaScript | Apache-2.0 | https://www.typescriptlang.org/ |
| Tailwind CSS 4 (+ @tailwindcss/vite) | Styling | MIT | https://tailwindcss.com/ |
| shadcn/ui | Component patterns (button, badge, textarea, tooltip) | MIT | https://ui.shadcn.com/ |
| Radix UI | Accessible primitives under shadcn/ui | MIT | https://www.radix-ui.com/primitives |
| lucide-react | Icons | ISC | https://lucide.dev/ |
| Motion | Animations | MIT | https://motion.dev/ |
| @number-flow/react | Animated numbers | MIT | https://number-flow.barvian.me/ |
| react-simple-maps | World map on the dashboard | MIT | https://www.react-simple-maps.io/ |
| world-atlas | Country shapes for the map | ISC | https://github.com/topojson/world-atlas |
| Natural Earth | Map data behind world-atlas | Public domain | https://www.naturalearthdata.com/ |
| class-variance-authority | Component style variants | Apache-2.0 | https://cva.style/ |
| cn | Merging Tailwind class names | MIT | https://github.com/shadcn-ui/cn |
| clsx | Class-name helper used by class-variance-authority | MIT | https://github.com/lukeed/clsx |
| tw-animate-css | Animation utilities for Tailwind | MIT | https://github.com/Wombosvideo/tw-animate-css |
| Vitest | UI tests | MIT | https://vitest.dev/ |
| Testing Library (react, user-event, jest-dom) | UI tests | MIT | https://testing-library.com/ |
| jsdom | Browser environment for tests | MIT | https://github.com/jsdom/jsdom |
| Oxlint | Linting | MIT | https://oxc.rs/ |

## UI design credits

| Name | What we took from it | Link |
|---|---|---|
| 21st.dev "SaaS Template" by @waleedkibhen | Page layout, nav, hero and black theme | https://21st.dev/@waleedkibhen/components/saa-s-template |
| 21st.dev "Kinetic Grid" by @satoriui (MIT) | Animated background grid | https://21st.dev/@satoriui/components/kinetic-grid |
| Magic UI "Animated Circular Progress Bar" (MIT) | Risk gauge | https://magicui.design/docs/components/animated-circular-progress-bar |
| 21st.dev "Text Highlight" by @animbits (MIT) | Marker-style highlight of risky words | https://21st.dev/@animbits/components/text-highlight |
| 21st.dev "Shiny Button" by @designali-in | Look of the main button (recreated, not copied) | https://21st.dev/@designali-in/components/shiny-button |
| DM Sans (Google Fonts, SIL OFL) | Body font | https://fonts.google.com/specimen/DM+Sans |
| Bitcount Ink (Google Fonts, SIL OFL) | Display font | https://fonts.google.com/specimen/Bitcount+Ink |

## Dashboard data sources

| Report | Link |
|---|---|
| GASA & Feedzai — Global State of Scams 2024 | https://gasa.org/knowledge-base/blog/global-state-of-scams-report-2024-1-trillion-stolen-in-12-months-gasa-feedzai |
| GASA — State of Scams in Malaysia / Thailand / Taiwan 2024 | https://gasa.org/knowledge-base/blog/where-did-the-billions-go-in-malaysia-thailand-taiwan |
| GASA — State of Scams in Japan 2024 | https://www.gasa.org/post/2024-state-of-scams-in-japan-report |
| GASA & ScamAdviser — Asia Scam Report 2024 | https://gasa.org/knowledge-base/blog/2024-asia-scam-report-688-billion-lost |
