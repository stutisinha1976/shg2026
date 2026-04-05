// frontend/src/utils/ngram.js

export class NGramEngine {
  constructor(n = 3) {
    this.n = n;
    this.ngrams = new Map();
  }

  // Train the model on an array of sentences
  train(corpus) {
    for (const sentence of corpus) {
      if (!sentence) continue;
      const tokens = sentence.toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/).filter(Boolean);
      
      // If the sentence is shorter than n, we can't build full n-grams, but we can build bi-grams if n=3 
      // by falling back dynamically, but we'll stick to fixed N for simplicity and clean matches.
      for (let i = 0; i <= tokens.length - this.n; i++) {
        const prefix = tokens.slice(i, i + this.n - 1).join(" ");
        const nextWord = tokens[i + this.n - 1];

        if (!this.ngrams.has(prefix)) {
          this.ngrams.set(prefix, {});
        }
        
        const possibleNextWords = this.ngrams.get(prefix);
        possibleNextWords[nextWord] = (possibleNextWords[nextWord] || 0) + 1;
      }
      
      // Also train a fallback bi-gram layer just in case we only have 1 word typed!
      if (this.n === 3) {
        for (let i = 0; i <= tokens.length - 2; i++) {
          const prefix = tokens[i];
          const nextWord = tokens[i + 1];
          if (!this.ngrams.has(prefix)) this.ngrams.set(prefix, {});
          const possibleNextWords = this.ngrams.get(prefix);
          possibleNextWords[nextWord] = (possibleNextWords[nextWord] || 0) + 0.5; // lower weight to bigrams
        }
      }
    }
  }

  // Predict the most probable completion based on current input text
  predict(text) {
    if (!text || text.trim() === '') return "";
    
    const endsWithSpace = text.endsWith(" ");
    const tokens = text.toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/).filter(Boolean);
    
    if (tokens.length === 0) return "";

    let prefix = "";
    let partialWord = "";

    if (endsWithSpace) {
      // User just typed a space. Predict the NEXT completely new word.
      // Use up to N-1 words as the prefix prefix context.
      prefix = tokens.slice(-(this.n - 1)).join(" ");
      // Fallback to exactly 1 word (bigram) if tri-gram context fails
      if (!this.ngrams.has(prefix) && tokens.length >= 1) {
         prefix = tokens[tokens.length - 1];
      }
    } else {
      // User is currently typing a word. Predict the remainder of this exact word.
      partialWord = tokens[tokens.length - 1];
      if (tokens.length >= 2) {
        prefix = tokens.slice(Math.max(0, tokens.length - this.n), -1).join(" ");
        // Fallback context 
        if (!this.ngrams.has(prefix)) {
           prefix = tokens[tokens.length - 2];
        }
      }
    }

    if (!prefix || !this.ngrams.has(prefix)) return "";

    const possibleWords = this.ngrams.get(prefix);
    
    // Find highest frequency word
    let bestWord = null;
    let maxFreq = 0;
    
    for (const [word, count] of Object.entries(possibleWords)) {
      if (endsWithSpace) {
         // Predict a fully new word
         if (count > maxFreq) { maxFreq = count; bestWord = word; }
      } else {
         // Autocomplete the partial word
         if (word.startsWith(partialWord) && word !== partialWord && count > maxFreq) {
           maxFreq = count; bestWord = word;
         }
      }
    }

    if (!bestWord) return "";
    
    return endsWithSpace ? bestWord : bestWord.slice(partialWord.length);
  }
}
