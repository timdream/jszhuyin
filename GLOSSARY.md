# Glossary

In order to promote the consistency of naming within the project, the following words should be used (and only these words) to describe each of corresponding concept.

The [Wikipedia article on Bopomofo](https://en.wikipedia.org/wiki/Bopomofo) and related linguistic topics should be the direct reference of any new entries whenever possible, but it is preferable to use common word than linguistic terms if the meaning of the word is acceptable.

This list is sorted alphabetically.

## Bopomofo

Bopomofo symbols are set of phonetic notations used to denote all sounds in [Mandarin](#mandarin). The Chinese name is romanized as “[Zhuyin](#zhuyin)”.

## Encoded Sound

There is only a finite set of [sounds](#sound) in [Mandarin](#mandarin), and each of them can be denoted in Bopomofo symbols deterministically.
Therefore, with smart math and bitwise operation, sounds can be converted into a 16 bit number.
The numbers can be converted (“encode”) from the human-readable Bopomofo symbol set, and back (“decode”).

This technique was found in [libtabe](http://sourceforge.net/projects/libtabe/) project and the project document states it was inspired by [ETen Chinese System](https://en.wikipedia.org/wiki/ETen_Chinese_System), in early-1990s.

This project implements the encoder-decoder in `lib/bopomofo_encoder.js`.
It's worthy to note the encoded sounds can be stored in strings, since JavaScript strings are encoded in USC-2.

## Input Method

> 輸入法

The written Chinese contains more graphemes than what can be ever put on a keyboard (it's been tried on printing presses and these machines are now in museums).
Computer users nowadays rely on input methods and it's search algorithm to find the desire outputs, from a limit set of symbols of input.

A Zhuyin-based input method (this project) uses Bopomofo symbols as inputs to do what's said above.

See [Wikipedia article on Input method](https://en.wikipedia.org/wiki/Input_method) for more information.

## Mandarin

> 普通話;華語;國語

The written Chinese can be pronounced in many Chinese languages. Mandarin, of northern origin, is the most widely spoken language, as a consequence of 20th century history.

[Bopomofo](#bopomofo) symbols are invented, originally, exclusively to denote sounds in Mandarin.

It is recommended to specifically distinguish the concept of “Mandarin” with written Chinese, although even native speakers don‘t do so often.

## Phrases

> 詞

A phrase is composed of multiple words, and represents a standalone meaning in modern Chinese (though there are often times single-[word](#word) phrase).
A “smart” Zhuyin-based input method therefore is about creating a search algorithm that could find the most probable phrases based on given set of sounds, automatically.

Phrases are collected as corpora and stored in the text corpus, to back the search algorithm of the input method.

## Sound

> 發音

A set of [Bopomofo](#bopomofo) symbols is used to compose a possible sound in Mandarin.
Many [words](#word) can be mapped to the same sound.
There are a lot of more different words than sounds in Mandarin.

## Symbol

> 符號

[Bopomofo](#bopomofo) symbol is what user actually types on a keyboard when operating an Zhuyin-based input method. Each of these symbols are assigned to a Unicode code point.

## Symbol Groups

[Bopomofo](#bopomofo) symbols can be classified into 3 groups, and the 5 [tonal marks](#tone) form it's own group.
Each of the groups represents different vocal component of the [sound](#sound), but the only related detail for us (for the purpose of information processing) is that all sounds can only have no or exactly one symbol from the same group.

Subsequently, “[encoded sound](#encoded-sound)” encodes each of the group in their own assigned bit positions.
We can also infer the number of sound a series of Bopomofo symbols inputted by pushing the next symbol in the same group to the next sound.

## Tone

> 聲調

Mandarin, like other spoken Chinese languages, are tonal languages.
A sound can only be denoted with a tone recorded by a tonal mark.

## Word

> 字

A word in Chinese is strictly refer to one, single, Chinese character, represented with one Unicode code point.
Almost all Chinese characters are morphemes, and almost all Chinese characters are, shockingly, contained in the CJK block within in Unicode BMP range (The 16 bit code point range).

As these are “almost”, and not facts, you should not assume a word can always fit in 16 bits, nor an “[encoded sound](#encoded-sound)” can already be matched by a word of same bit-length.

## Zhuyin

> 注音

“Zhuyin” the common romanization of the Chinese term “[Bopomofo](#bopomofo) symbols”, ironically, romanized in Pinyin.
