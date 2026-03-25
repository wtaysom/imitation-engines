#!/usr/bin/env python3
"""Transform quote syntax from source markdown to Jekyll-ready format.

Source syntax:
    Speaker Name:
        Indented quote text

    Speaker Name: https://optional-url
        Indented quote text

    (Plain indented text without speaker header becomes a plain blockquote)
"""

import re
import sys

SPEAKER_RE = re.compile(r'^([^:\[\]()"*>]+?):\s*(https?://\S+)?\s*$')


def is_speaker_header(line):
    m = SPEAKER_RE.match(line)
    return m if m else None


def collect_indented_block(lines, start):
    """Collect consecutive 4-space-indented lines, allowing internal blank lines."""
    block = []
    i = start
    while i < len(lines):
        if lines[i].startswith('    '):
            block.append(lines[i][4:])
            i += 1
        elif lines[i].strip() == '':
            # Blank line — keep it if more indented text follows
            k = i + 1
            while k < len(lines) and lines[k].strip() == '':
                k += 1
            if k < len(lines) and lines[k].startswith('    '):
                block.append('')
                i += 1
            else:
                break
        else:
            break
    # Strip trailing blank lines
    while block and block[-1] == '':
        block.pop()
    return block, i


def slugify_question(block):
    """Turn a question block into a concise dashed slug."""
    text = ' '.join(block).strip()
    # Remove punctuation, lowercase
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text).lower().split()
    # Drop common words
    stops = {'a', 'an', 'the', 'is', 'are', 'was', 'were', 'do', 'does', 'did',
             'can', 'could', 'would', 'should', 'what', 'how', 'why', 'when',
             'where', 'who', 'which', 'that', 'this', 'it', 'its', 'about',
             'with', 'for', 'and', 'or', 'of', 'to', 'in', 'on', 'at', 'be',
             'have', 'has', 'had', 'your', 'you', 'we', 'our', 'their'}
    words = [w for w in text if w not in stops]
    # Take first 4-5 meaningful words
    slug = '-'.join(words[:5])
    return slug or 'question'


def transform(text, anchor_questions=False):
    lines = text.splitlines()
    output = []
    i = 0
    question_count = 0

    while i < len(lines):
        line = lines[i]

        # Check for image: !~~ filename.ext alt text
        if line.startswith('!~~ '):
            parts = line[4:].split(' ', 1)
            filename = parts[0]
            alt = parts[1] if len(parts) > 1 else ''
            output.append(f'![{alt}]({{{{ \'/assets/images/{filename}\' | relative_url }}}})')
            i += 1
            continue

        # Check for speaker header
        m = is_speaker_header(line)
        if m:
            speaker = m.group(1).strip()
            url = m.group(2)

            # Speaker header requires indented text on the very next line.
            # A blank line means it's a sentence ending with a colon, not a speaker.
            j = i + 1
            if j < len(lines) and lines[j].startswith('    '):
                # Emit quote-header
                header = f'<div class="quote-header"><span class="quote-speaker">{speaker}</span>'
                if url:
                    header += f'<span class="quote-source"><a href="{url}">🔗</a></span>'
                header += '</div>'
                output.append(header)
                output.append('')

                # Collect and convert indented block to blockquote
                block, j = collect_indented_block(lines, j)
                for bline in block:
                    output.append(f'> {bline}' if bline else '>')
                # Ensure blank line after blockquote
                if output and output[-1] != '':
                    output.append('')

                i = j
                continue

        # Plain indented text (no speaker header)
        if line.startswith('    '):
            block, i = collect_indented_block(lines, i)
            if anchor_questions:
                question_count += 1
                slug = slugify_question(block)
                output.append(f'<div class="question-header"><a href="#{slug}" id="{slug}">⚓</a></div>')
                output.append('')
            for bline in block:
                output.append(f'> {bline}' if bline else '>')
            # Ensure blank line after blockquote
            if output and output[-1] != '':
                output.append('')
            continue

        output.append(line)
        i += 1

    result = '\n'.join(output) + '\n'

    # Rainbow links: [text]!(url) → <a href="url" class="rainbow">text</a>
    result = re.sub(
        r'\[([^\]]+)\]!\(([^)]+)\)',
        r'<a href="\2" class="rainbow">\1</a>',
        result,
    )

    return result


def main():
    with open(sys.argv[1]) as f:
        text = f.read()

    result = transform(text)

    if len(sys.argv) > 2:
        with open(sys.argv[2], 'w') as f:
            f.write(result)
    else:
        sys.stdout.write(result)


if __name__ == '__main__':
    main()
