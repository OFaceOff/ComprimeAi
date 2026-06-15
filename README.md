# 🔧 ComprimeAi

### Compressor e Redutor de Arquivos com Foco em Privacidade

O **ComprimeAi** é uma aplicação web leve e responsiva desenvolvida para reduzir o tamanho de arquivos de imagem (**JPG, PNG e WEBP**) com precisão cirúrgica. Ao contrário de compressores convencionais, o ComprimeAi permite que o usuário defina o **tamanho exato desejado** (em KB ou MB).

O grande diferencial tecnológico deste projeto é o processamento **100% Client-Side (no navegador)**. Nenhuma imagem é enviada para servidores externos, garantindo **privacidade absoluta** e economia de banda.

---

## ✨ Funcionalidades Principais

### 🔒 Privacidade Total
Processamento de arquivos local via **HTML5 Canvas API**. Nenhuma requisição de rede contendo dados do usuário é realizada.

### 🎯 Compressão por Alvo (Target Size)
Algoritmo de busca binária integrado para encontrar a melhor qualidade de imagem que atinja o peso exato especificado.

### 🛡️ Smart Padding
Se a compressão natural máxima ainda resultar em um arquivo menor que o peso exigido pelo usuário, o script preenche o binário da imagem com bytes inativos sem corromper o arquivo.

---

## 🚀 Tecnologias Utilizadas

| Categoria | Tecnologia |
|------------|------------|
| Frontend Core | HTML5, CSS3, Vanilla JavaScript (ES6+) |
| Estilização | Tailwind CSS (via CDN) |
| Processamento de Imagem | CanvasRenderingContext2D e Blob API |
| Ícones | Lucide Icons |

---

## 🛠️ Como Rodar o Projeto Localmente

### Clone o repositório

```bash
git clone https://github.com/OFaceOff/ComprimeAi.git
```

### Acesse a pasta do projeto

```bash
cd comprimeai
```

### Execute

Abra o arquivo `index.html` em qualquer navegador moderno.
Opcionalmente, utilize o Live Server do VS Code.

---

## 🧠 Como o Algoritmo de Compressão Funciona?

1. A imagem é renderizada em um elemento `<canvas>`.
2. Um algoritmo de Busca Binária ajusta a qualidade da imagem entre `0.0` e `1.0`.
3. São realizados múltiplos testes utilizando:

```javascript
canvas.toDataURL('image/jpeg', qualidade)
```

4. O arquivo mais próximo do tamanho desejado é selecionado.
5. O resultado é convertido em um `Blob`.
6. Um link temporário é criado com:

```javascript
URL.createObjectURL(blob)
```

7. O download é realizado diretamente pelo navegador.

---
## 📄 Licença

Distribuído sob a licença **MIT**.
Consulte o arquivo `LICENSE` para mais informações.

---

**FStudio © 2026**
Desenvolvido com foco em desempenho, privacidade e simplicidade.