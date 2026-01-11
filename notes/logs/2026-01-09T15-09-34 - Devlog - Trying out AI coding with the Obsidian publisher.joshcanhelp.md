---
tags:
  - artifact/devlog
---
## References

- [CHOP](https://sourcegraph.com/blog/chat-oriented-programming-in-action)
- [Publishing Obsidian notes](https://github.com/joshcanhelp/md-note-mapper)

---

First, I had [Claude](https://claude.ai) parse this HN thread:
https://news.ycombinator.com/item?id=46515696

.. and put together a list of all the tips with an evaluation. Then I had it read [People/Bobby Johnson](https://www.linkedin.com/in/notmyself74/)'s guide:
https://gist.github.com/NotMyself/7d15810b1c4b6fc71b34bd3b3be0f112

I had it merge the two and output a Markdown guide for the project:
https://github.com/joshcanhelp/md-note-mapper/blob/feb9bb090852652460582ef9423630a7c127b06a/CHOP.md

I described the project to Claude code after pointing it to the file above:

> The project is to build an npm module that can be configured to look in a direct for Markdown files that match a certain pattern, then copy those into the repo that's using the tool. The source files should not ever be altered and the output files should be mapped directyl from the source so if a source file is changed or deleted, the output file is deleted as well. I want to be able to allow for multiple users as well, so 2 or more people could sync their files to the repo and only their files will be affected.

We went back and forth and came up with this:
https://github.com/joshcanhelp/md-note-mapper/blob/d81b81b0d53c4ae9336a0f8b6f7bdac2b85df564/DESIGN.md

It was helpful that Claude was taking it step by step and I was able to read through the files it created before committing. It did quite well for a first pass!

As I was reviewing everything, I didn't notice that it was just writing code and tests like crazy. I had to call it back and point to the CHOP document for reference to setup a `.beads` directory:
https://github.com/steveyegge/beads

I know jack shit about that but I'm trying to vibe this more than usual and this was mentioned on HN. I like it so far!

I've been going back and forth with Claude for about a half hour and I'm impressed by how far we've gotten! Reading the code is not as bad as I expected, especially with it pausing regularly. I'm able to check to make sure the haptics work well and that it's doing what I want it to do. So far so good. A few things:

- I'm feeling a bit of discomfort around the fact that I don't know what all the lines are doing. This, of course, is going to grow as the project gets bigger. I think the focus on tests and linting will help but I'm looking forward to what the first troubleshooting round is going to look like.
- This also has be thinking about code reviews and larger projects. What does a PR review look like if AI wrote it? If AI wrote it and the person reviewed it line-by-line, does that need a second person?
- It's not too bad to be thinking about the next thing while it works on something.
- It's hard to figure out where to put all the specific documentation. Some of it is specifically for an agent and some is for the person using it but maybe it's all a bit gray? What's useful for an agent is probably useful for a person too, in a lot of cases. It's like we're at the self-driving stage where you have to account for both.

First bug just happened and Claude is struggling. Next one I'll try to debug on my own and see how it goes. 

Had to dive in on a problem with string matching (more about requirements than broken functionality) and had no problem finding and fixing the issue!

If you're seeing this note, the sync works!
