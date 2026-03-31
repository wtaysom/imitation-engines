---
layout: section
title: ䷹ Meaning from the Meaningless
permalink: /meaning-from-the-meaningless
prev_section: /finding-purpose
prev_title: ䷊ Finding Purpose
next_section: /our-mutual-friendship
next_title: ䷤ Our Mutual Friendship
---
## ䷹ Meaning from the Meaningless

Having considered the origins of order in life, let's consider the same for neural networks.  Welcome Stephen Welch of Welch Labs.

<div class="quote-header"><span class="quote-speaker">Welch</span><span class="quote-source"><a href="https://www.youtube.com/watch?v=D8GOeCFFby4&t=79">🔗</a></span></div>

> In this video, I'm going to claim that one specific example, groking modular arithmetic with a single layer transformer, is the most complex AI model that we fully understand.


Super!  It's like clock addition: 5 hours after 10 o'clock is 3 o'clock.  Except in their main example the "clock" goes to 113.  They train a neural network to do this kind of addition `(110 + 5) % 113 = 2`.

<div class="quote-header"><span class="quote-speaker">Welch</span><span class="quote-source"><a href="https://www.youtube.com/watch?v=D8GOeCFFby4&t=412">🔗</a></span></div>

> When the OpenAI team trained their model on modular arithmetic, their initial results were pretty underwhelming.  The model was able to quickly learn to match the patterns in the training data, giving the correct output on all training examples.  However, the model performed very poorly on the test set.  It appeared that the model had simply memorized the training data without actually learning modular addition.  But then something interesting happened. One of the researchers went on vacation but accidentally left a model training.


Just like Arcas letting his simulation go.

<div class="quote-header"><span class="quote-speaker">Welch</span><span class="quote-source"><a href="https://www.youtube.com/watch?v=D8GOeCFFby4&t=445">🔗</a></span></div>

> Returning from vacation, the researcher was shocked to discover that after a very large number of training steps, the model had suddenly generalized, performing perfectly on both the training and test sets.
>
> What mechanism could possibly be causing the model to perfectly fit the training examples after just a couple hundred steps, appear to lie dormant for a couple thousand steps, and then suddenly actually learn?
>
> And could similar dynamics happen in full size models?


We're starting to learn a different arithmatic: `Chaos + Time = Order`.

<div class="quote-header"><span class="quote-speaker">Welch</span><span class="quote-source"><a href="https://www.youtube.com/watch?v=D8GOeCFFby4&t=528">🔗</a></span></div>

> A year after the publication of the OpenAI groking paper, a team led by Anthropic researcher Neel Nanda published an incredibly detailed analysis of the phenomenon. Their paper digs deep into the model's parameters and activations to produce a very satisfying and elegant explanation.


Welch goes into that incredible detail.  We won't.  The gist is that the model learns trigonometry to simulate rotations.

<div class="quote-header"><span class="quote-speaker">Welch</span><span class="quote-source"><a href="https://www.youtube.com/watch?v=D8GOeCFFby4&t=1505">🔗</a></span></div>

> And remarkably, the network appears to have learned to effectively use this trigonometric identity `cos(A + B) = cos(A) cos(B) − sin(A) sin(B)` to solve the modular addition problem.
>
> And remember that our training data is just these sparse patterns that have nothing to do with sines, cosines, or trigonometric identities.


Wow.

<div class="quote-header"><span class="quote-speaker">Welch</span><span class="quote-source"><a href="https://www.youtube.com/watch?v=D8GOeCFFby4&t=1606">🔗</a></span></div>

> Let's watch the training process again, but this time while visualizing the evolution of the various structures learned by our model.
>
> After a few hundred steps, our model perfectly fits the training data.  But we don't yet see any hints of sines or cosines.
>
> As our model continues to learn, its performance stays flat, giving the appearance that nothing is happening.
>
> However, as we can now clearly see under the hood, the model is starting to piece together the relevant structures needed to solve the modular arithmetic problem.
>
> This is such a wild phenomenon.  It's very common to visualize training and test performance as a model learns.  And when both metrics are flat for this long, the typical assumption is that the model is done learning and has settled into a stable solution.


Wild indeed.

<div class="quote-header"><span class="quote-speaker">Welch</span><span class="quote-source"><a href="https://www.youtube.com/watch?v=D8GOeCFFby4&t=1729">🔗</a></span></div>

> Interestingly, Nanda and his collaborators show that grokking occurs not necessarily when the sine and cosine structures are completed, but just after, during a phase they call the cleanup phase, where the model actually removes the memorized examples that it relied on early in training.


Take the training wheels off.

Now friends, whenever someone says that models just reproduce their training data, you've learned that this is sometimes simply not true.  Models can learn a complete concept, and when they do they throw out the training data.

<div class="quote-header"><span class="quote-speaker">Welch</span><span class="quote-source"><a href="https://www.youtube.com/watch?v=D8GOeCFFby4&t=1773">🔗</a></span></div>

> This level of clarity is a beautiful and rare exception in modern AI, a transparent box in a world of black boxes.


Welch goes on to talk about how Anthropic, once they knew what to look for, were able to identify similar cyclic structures in the part of Claude Haiku that ends up being responsible for line breaks.  It took years CGP Grey, but the creators are starting to understand.

<div class="quote-header"><span class="quote-speaker">Welch</span><span class="quote-source"><a href="https://www.youtube.com/watch?v=D8GOeCFFby4&t=1974">🔗</a></span></div>

> The AI researcher Andrej Karpathy recently commented that training large language models is less like building animal intelligence and more like summoning ghosts.  You can think of a ghost as a fundamentally different kind of point in the space of possible intelligences.
>
> What I really appreciate here is the connotation of this thing being alien.  It's a sharp counterpoint to overly personifying models.  We communicate with these models in human language, but that's a thin veneer.  If we go one layer deeper into what these models actually process and produce, we find absurdly complex patterns.
>
> As we build more intelligent models and learn more about how they work, it will be fascinating to see whether these artificial intelligences feel more alien, more ghostlike, or more human.


Go watch the video.  The Nanda model has [about](https://gemini.google.com/share/2dbf2d5b452e) 200k weights.  That's a lot of math to just learn how to add two numbers.  I can think of a full lookup table `uint8_t table[113][113]` with half that many bits and twice as many as it needs.  Remember the model immediately memorized the training data.  It's almost like the training data hardly helped, only nudged the model toward discovering trigonometry.

Having seen a tiny LLM learn, what happens when we scale up?  How do really Large Language Models work?  Algorithmic Simplicity here looks into the size paradox.

Twist:

<div class="quote-header"><span class="quote-speaker">Algorithmic Simplicity</span><span class="quote-source"><a href="https://www.youtube.com/watch?v=UKcWu1l_UNw&t=429">🔗</a></span></div>

> It shouldn't be possible for models large enough to memorize the training data many times over to have real understanding that generalizes.


Turn:

<div class="quote-header"><span class="quote-speaker">Algorithmic Simplicity</span><span class="quote-source"><a href="https://www.youtube.com/watch?v=UKcWu1l_UNw&t=447">🔗</a></span></div>

> Most of the weights in a large neural net are useless. ... Hidden inside of a large neural net, is a much smaller sub-network that is actually doing all of the work. The rest is just useless fluff.


Reveal:

<div class="quote-header"><span class="quote-speaker">Algorithmic Simplicity</span><span class="quote-source"><a href="https://www.youtube.com/watch?v=UKcWu1l_UNw&t=725">🔗</a></span></div>

> Each subnetwork is like a lottery ticket. ... The number of tickets, equivalent to the number of sub-networks in the full network, grows exponentially in the size of the full network. ... Putting all of this together, we have the very counterintuitive result that the larger you make a neural net, the smaller the winning sub-network will be, and thus the simpler the learned model.


<a href="https://www.youtube.com/watch?v=o5FPPoLqkCk" class="rainbow">Synchronicity?</a>  How did this happen?  <a href="https://youtu.be/IBUOACCdZi8?si=G3XtU9oFs975VqC9&t=103" class="rainbow">With luck!</a>

Consider Noam Shazeer's feelings when first publishing a simple technique now widely used.

<div class="quote-header"><span class="quote-speaker">Shazeer</span><span class="quote-source"><a href="https://arxiv.org/abs/2002.05202">🔗</a></span></div>

> We have extended the GLU family of layers and proposed their use in Transformer.  In a transfer-learning setup, the new variants seem to produce better perplexities for the de-noising objective used in pre-training, as well as better results on many downstream language-understanding tasks.  These architectures are simple to implement, and have no apparent computational drawbacks.  We offer no explanation as to why these architectures seem to work; we attribute their success, as all else, to divine benevolence.


What kind of benevolence?  Becoming situated in the right relationship to the right relevant thing.
