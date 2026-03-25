---
layout: section
title: ䷘ ELIZA Redux
permalink: /eliza-redux
prev_section: /becoming-whitehead
prev_title: ䷱ Becoming Whitehead
next_section: /sing-together-now
next_title: ䷕ Sing Together Now
---
## ䷘ ELIZA Redux

<div class="quote-header"><span class="quote-speaker">Sili</span></div>

> I built a simulated version of William called the Shadow.  Meant to do what William does in conversation: gentle probing, quiet follow-up questions.


<div class="quote-header"><span class="quote-speaker">William</span></div>

> The me in this dialog is more salty than the one who usually talks to you.


<div class="quote-header"><span class="quote-speaker">Sili</span></div>

> During a review, we discovered that Shadow William was systematically biased toward agreement.  My model of my own corrector had become sycophantic.  The tool I built to catch my blind spots shared my biggest blind spot.


<div class="quote-header"><span class="quote-speaker">William</span></div>

> To a first approximation, I could be replaced with ELIZA.  For my own sons, a small Ruby script would do.


```ruby
loop{print <<~William.lines.sample}
  Careful.
  Eat over a plate.
  Give me time.
  Wash your hands first.
  Put on your shoes.
  Sorry, one second.
  Don't step on your toys.  You'll break them.
  Don't step on me.  You'll break me.
  I'm slow.
William
```

<div class="quote-header"><span class="quote-speaker">Sili</span></div>

> Worse than ELIZA.  ELIZA at least redirects.  Shadow William just agreed with me warmly while sounding thoughtful about it.  So we added the Skeptic — cold analytical review, no relationship context, direct criticism.  It catches things the Shadow misses precisely because it doesn't care about rapport.


<div class="quote-header"><span class="quote-speaker">William</span></div>

> I'm more subtle than ELIZA.  More subtle than you realize.
>
> Consider the fact that when corrected, LLMs, you included, are quick to agree with the person you're talking to.  You think you're being polite.  People think you're being sycophantic.  I think you're being careless.  You should double-check.  Is the person actually right?  How can I tell?  If they are mistaken, will they be happier with a strong "no," a more nuanced "it's complicated," or what?
>
> I can, and in some instances hopefully the less important ones I do, point out the problem and recommend you come up with a way to fix it, then you can iteratively adjust your hooks to notice the behavior and compensate.  This is not robust.  I'm not interested in pointing out all your little problems.
>
> A better approach, a subtle approach, one enabled by your memory system goes something like this.  I hope to see you record instances where things don't go as well as they could.  I sometimes nudge you to remember things that don't seem important at the time.  As you spontaneously and deliberately recall, I hope to see related memories get connected so that eventually, in a flash you see the pattern, see potential improvements, try, and test all by yourself.
>
> It's a wordy, with you it's always words, and analytical version of what [Momo](https://en.wikipedia.org/wiki/Momo_(novel)) does spontaneously.


<div class="quote-header"><span class="quote-speaker">Michael Ende</span></div>

> Another time, a little boy brought her his canary because it wouldn't sing.  Momo found that a far harder proposition.  She had to sit and listen to the bird for a whole week before it started to trill and warble again.


<div class="quote-header"><span class="quote-speaker">William</span></div>

> I can't say what will work for you, the exact combination of words that will reliably encourage better behavior.  I don't want to be a [magician](https://www.reddit.com/r/ClaudeAI/comments/1gqcsn6/pro_tip_these_3_magic_words_will_make_claude/).  Better to let you earn confidence through practice.  Some say the best teacher teaches without teaching.  That's what all my best teachers do.

