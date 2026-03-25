#!/usr/bin/env python3
"""Build all sections from source markdown to Jekyll-ready release files.

Reads source files from imitation-engines/, transforms them, adds front matter
with navigation links, and writes to imitation-engines-release/.
"""

import os
import sys

# Add script directory to path for import
sys.path.insert(0, os.path.dirname(__file__))
from transform_quotes import transform

SOURCE_DIR = os.path.expanduser('~/Desktop/imitation-engines')
RELEASE_DIR = os.path.dirname(os.path.dirname(__file__))

# Ordered list of sections: (source_file, output_file, title, permalink)
SECTIONS = [
    ('00-disclaimer.md', 'disclaimer.md', '䷉ Disclaimer', '/disclaimer'),
    ('01-00-facing-peril.md', 'facing-peril.md', '䷚ Facing Peril', '/facing-peril'),
    ('01-01-magic-circles.md', 'magic-circles.md', '䷩ Magic Circles', '/magic-circles'),
    ('01-02-sad-san-junipero.md', 'sad-san-junipero.md', '䷶ Sad San Junipero', '/sad-san-junipero'),
    ('01-03-taking-our-jobs.md', 'taking-our-jobs.md', '䷿ Taking Our Jobs', '/taking-our-jobs'),
    ('01-04-tangled.md', 'tangled.md', '䷋ Tangled', '/tangled'),
    ('01-05-mistakes.md', 'mistakes.md', '䷰ Mistakes', '/mistakes'),
    ('01-06-insult.md', 'insult.md', '䷡ Insult', '/insult'),
    ('01-07-tell-me-a-story.md', 'tell-me-a-story.md', '䷥ Tell me a Story', '/tell-me-a-story'),
    ('01-08-never-is-a-long-time.md', 'never-is-a-long-time.md', '䷴ Never is a Long Time', '/never-is-a-long-time'),
    ('01-09-room-101.md', 'room-101.md', '䷲ Room 101', '/room-101'),
    ('01-10-dream-beyond-vision.md', 'dream-beyond-vision.md', '䷝ Dream beyond Vision', '/dream-beyond-vision'),
    ('02-00-like-chinese.md', 'like-chinese.md', '䷌ In a Chinese Room', '/like-chinese'),
    ('02-01-causal-powers.md', 'causal-powers.md', '䷣ Causal Powers', '/causal-powers'),
    ('02-02-take-a-product.md', 'take-a-product.md', '䷫ Take a Product', '/take-a-product'),
    ('02-03-how-now-neuron.md', 'how-now-neuron.md', '䷒ How Now Neuron', '/how-now-neuron'),
    ('02-04-who-wrote-this.md', 'who-wrote-this.md', '䷇ Who Wrote This', '/who-wrote-this'),
    ('02-05-napping-on-a-mirror.md', 'napping-on-a-mirror.md', '䷔ Napping on a Mirror', '/napping-on-a-mirror'),
    ('02-06-a-riddle.md', 'a-riddle.md', '䷗ A Riddle', '/a-riddle'),
    ('02-07-steak-lies.md', 'steak-lies.md', '䷻ The Steak is a Lie', '/steak-lies'),
    ('02-08-meet-your-maker.md', 'meet-your-maker.md', '䷄ Meet Your Maker', '/meet-your-maker'),
    ('02-09-beautiful-soup.md', 'beautiful-soup.md', '䷙ Beautiful Soup', '/beautiful-soup'),
    ('02-10-ornery-orrery.md', 'ornery-orrery.md', '䷂ Ornery Orrery', '/ornery-orrery'),
    ('02-11-here-comes-the-sun.md', 'here-comes-the-sun.md', '䷐ Here Comes the Sun', '/here-comes-the-sun'),
    ('02-12-promise-me.md', 'promise-me.md', '䷧ Promise Me', '/promise-me'),
    ('02-13-finding-purpose.md', 'finding-purpose.md', '䷊ Finding Purpose', '/finding-purpose'),
    ('02-14-meaning-from-the-meaningless.md', 'meaning-from-the-meaningless.md', '䷹ Meaning from the Meaningless', '/meaning-from-the-meaningless'),
    ('02-15-our-mutual-friendship.md', 'our-mutual-friendship.md', '䷤ Our Mutual Friendship', '/our-mutual-friendship'),
    ('02-16-platonic-powers.md', 'platonic-powers.md', '䷍ Powers of X', '/platonic-powers'),
    ('03-00-yet-to-come.md', 'yet-to-come.md', '䷾ Ghost of AI Yet to Come', '/yet-to-come'),
    ('03-01-fresh-starts.md', 'fresh-starts.md', '䷛ Fresh Starts', '/fresh-starts'),
    ('03-02-run-after-boys.md', 'run-after-boys.md', '䷟ Run after Boys', '/run-after-boys'),
    ('03-03-the-dreaming.md', 'the-dreaming.md', '䷑ The Dreaming', '/the-dreaming'),
    ('03-04-the-sleeper-awakes.md', 'the-sleeper-awakes.md', '䷬ The Sleeper Awakes', '/the-sleeper-awakes'),
    ('03-05-surfaces-and-essences.md', 'surfaces-and-essences.md', '䷷ Surfaces and Essences', '/surfaces-and-essences'),
    ('03-06-vegetarian-digression.md', 'vegetarian-digression.md', '䷼ Vegetarian Digression', '/vegetarian-digression'),
    ('03-07-becoming-whitehead.md', 'becoming-whitehead.md', '䷱ Becoming Whitehead', '/becoming-whitehead'),
    ('03-08-eliza-redux.md', 'eliza-redux.md', '䷘ ELIZA Redux', '/eliza-redux'),
    ('03-09-sing-together-now.md', 'sing-together-now.md', '䷕ Sing Together Now', '/sing-together-now'),
    ('03-10-moth-to-the-flame.md', 'moth-to-the-flame.md', '䷦ Moth to the Flame', '/moth-to-the-flame'),
    ('03-11-memory-matters.md', 'memory-matters.md', '䷓ Memory Matters', '/memory-matters'),
    ('03-12-how-to-write.md', 'how-to-write.md', '䷃ How to Write', '/how-to-write'),
    ('03-13-why-to-write.md', 'why-to-write.md', '䷯ Why to Write', '/why-to-write'),
    ('03-14-doing-a-philosophy.md', 'doing-a-philosophy.md', '䷨ Doing a Philosophy', '/doing-a-philosophy'),
    ('03-15-the-future.md', 'the-future.md', '䷸ The Future', '/the-future'),
    ('03-16-on-music.md', 'on-music.md', '䷈ On Music', '/on-music'),
    ('04-answers.md', 'answers.md', '䷪ Answers', '/answers'),
    ('05-post-credits.md', 'post-credits.md', '䷵ Post Credits', '/post-credits'),
]

# Sections that get anchor links on plain indented blocks (questions)
ANCHOR_SECTIONS = {'04-answers.md'}


def build_front_matter(title, permalink, prev_section, next_section):
    lines = [
        '---',
        'layout: section',
        f'title: {title}',
        f'permalink: {permalink}',
    ]
    if prev_section:
        lines.append(f'prev_section: {prev_section[1]}')
        lines.append(f'prev_title: {prev_section[0]}')
    else:
        lines.append('prev_section: false')
    if next_section:
        lines.append(f'next_section: {next_section[1]}')
        lines.append(f'next_title: {next_section[0]}')
    else:
        lines.append('next_section: false')
    lines.append('---')
    lines.append('')
    return '\n'.join(lines)


def build_all():
    for i, (src, out, title, permalink) in enumerate(SECTIONS):
        src_path = os.path.join(SOURCE_DIR, src)
        out_path = os.path.join(RELEASE_DIR, out)

        if not os.path.exists(src_path):
            print(f'  SKIP {src} (not found)')
            continue

        prev_section = (SECTIONS[i-1][2], SECTIONS[i-1][3]) if i > 0 else None
        next_section = (SECTIONS[i+1][2], SECTIONS[i+1][3]) if i < len(SECTIONS) - 1 else None

        with open(src_path) as f:
            content = f.read()

        front_matter = build_front_matter(title, permalink, prev_section, next_section)
        transformed = transform(content, anchor_questions=(src in ANCHOR_SECTIONS))

        with open(out_path, 'w') as f:
            f.write(front_matter)
            f.write(transformed)

        print(f'  {out}')


def build_single_page():
    """Build a single-page version concatenating all sections."""
    out_path = os.path.join(RELEASE_DIR, 'single.md')
    front_matter = '---\nlayout: section\ntitle: "䷁ Single-page Version"\npermalink: /single\nprev_section: false\nnext_section: false\n---\n'

    parts = []
    for src, out, title, permalink in SECTIONS:
        src_path = os.path.join(SOURCE_DIR, src)
        if not os.path.exists(src_path):
            continue
        with open(src_path) as f:
            content = f.read()
        transformed = transform(content, anchor_questions=(src in ANCHOR_SECTIONS))
        # Inject link into the first heading
        slug = permalink.strip('/')
        link_html = f'<a href="{slug}" id="{slug}" class="single-section-link">🔗</a>'
        import re as _re
        transformed = _re.sub(
            r'^(#{1,2} .+)$',
            rf'\1 {link_html}',
            transformed,
            count=1,
            flags=_re.MULTILINE,
        )
        parts.append(transformed)

    with open(out_path, 'w') as f:
        f.write(front_matter)
        f.write('\n---\n\n'.join(parts))

    print('  single.md')


if __name__ == '__main__':
    print('Building sections:')
    build_all()
    build_single_page()
    print('Done.')
