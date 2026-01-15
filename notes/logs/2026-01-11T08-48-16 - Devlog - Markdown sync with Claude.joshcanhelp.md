## References

- [CHOP](https://sourcegraph.com/blog/chat-oriented-programming-in-action)
- [Publishing Obsidian notes](https://github.com/joshcanhelp/md-note-mapper)

---

I've been really distracted by this project, in a good way. I'm still quite impressed by how far I've gotten with this (I feel funny attributing the progress to me) in about 2.5 hours. The code is understandable and modular, the documentation is passable for now, and I even, actually, much to my surprise, have had fun so far. 

I've learned a lot about how this works fairly quickly and the CHOP guidelines have been very helpful, both for me and [Claude](https://claude.ai). Having something else doing the majority of the construction is, like I've read over and over, forced me to think more clearly about what actually needs to be built. And because I'm not aware of all the lines of code, building step-by-step in a modular way that can be tested is really important. That makes for more clear software (so far) so I can debug it fairly easily.

All in all, I'm impressed and pleased so far. Not what I expected!

Moving on to defining the next epic ...

As usual, making good progress with code but we've hit another snag/bug. The links are not mapping over properly and I'm getting that feeling inside like "uh oh, I don't know this codebase as well as I would if I wrote it." That's fine. Time spent debugging will improve my understanding and, hopefully, will be a fraction of what it takes to write it.

Back on track and it's working well. I'm still quite uncomfortable with the fact that I don't know precisely how this is working. I think I could have spent more time reviewing the tests, at the very least, but I was sucked into making progress quickly. 

I will say that the code is written in a really clear and modular way, which helps a lot. Clarity of output feels really important if this is going to become long-term maintained code. Short, testable functions, long and clear variable names, modularity. All the stuff the industry has been harping on for clarity but now the AI is making that easier and more consistent.

In the end, a lot of the discomfort here is the general discomfort that comes with building software. The feeling I have when I dig into the code that I didn't write directly is similar to when I have to debug a colleagues code, or even mine from a few months ago. I don't recall where that one module is or what exactly that code does. What occurs to me, though, is that the code generator, in this case, is not a perpetually fallible human being but a more predictably fallible AI that's much better at getting feedback. I'm finding myself enshrining all the things that I need in all the MD docs that I'm writing for it. I've heard this said many times but I'm now seeing what that means in practice.

---

Time to test this thing in depth:

- Basic syncing with built-in transforms work as expected
- All the other basic commands work as expected
- Property mapping works as far as I've tried it.
- I found a bug with the custom transforms but Claude figured it out