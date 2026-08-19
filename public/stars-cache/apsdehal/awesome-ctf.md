# Awesome CTF [![Build Status](https://travis-ci.org/apsdehal/awesome-ctf.svg?branch=master)](https://travis-ci.org/apsdehal/awesome-ctf) [![Awesome](https://cdn.rawgit.com/sindresorhus/awesome/d7305f38d29fed78fa85652e3a63e154dd8e8829/media/badge.svg)](https://github.com/sindresorhus/awesome)

A curated list of [Capture The Flag](https://en.wikipedia.org/wiki/Capture_the_flag#Computer_security) (CTF) frameworks, libraries, resources, softwares and tutorials. This list aims to help starters as well as seasoned CTF players to find everything related to CTFs at one place.

### Contributing

Please take a quick look at the ⭐️ 11,243 [contribution guidelines](https://github.com/apsdehal/ctf-tools) first.

#### _If you know a tool that isn't present here, feel free to open a pull request._

### Why?

It takes time to build up collection of tools used in CTF and remember them all. This repo helps to keep all these scattered tools at one place.

### Contents

- [Awesome CTF](#awesome-ctf)
  - [Create](#create)
    - [Forensics](#forensics)
    - [Platforms](#platforms)
    - [Steganography](#steganography)
    - [Web](#web)
  - [Solve](#solve)
    - [Attacks](#attacks)
    - [Bruteforcers](#bruteforcers)
    - [Cryptography](#crypto)
    - [Exploits](#exploits)
    - [Forensics](#forensics-1)
    - [Networking](#networking)
    - [Reversing](#reversing)
    - [Services](#services)
    - [Steganography](#steganography-1)
    - [Web](#web-1)

- [Resources](#resources)
  - [Operating Systems](#operating-systems)
  - [Starter Packs](#starter-packs)
  - [Tutorials](#tutorials)
  - [Wargames](#wargames)
  - [Websites](#websites)
  - [Wikis](#wikis)
  - [Writeups Collections](#writeups-collections)


# Create

*Tools used for creating CTF challenges*

- [Kali Linux CTF Blueprints](https://www.packtpub.com/eu/networking-and-servers/kali-linux-ctf-blueprints) - Online book on building, testing, and customizing your own Capture the Flag challenges.


## Forensics

*Tools used for creating Forensics challenges*

- ⭐️ 3,829 [Dnscat2](https://github.com/iagox86/dnscat2) - Hosts communication through DNS.
- [Kroll Artifact Parser and Extractor (KAPE)](https://learn.duffandphelps.com/kape) - Triage program.
- [Magnet AXIOM](https://www.magnetforensics.com/downloadaxiom) - Artifact-centric DFIR tool.
- [Registry Dumper](http://www.kahusecurity.com/posts/registry_dumper_find_and_dump_hidden_registry_keys.html) - Dump your registry.

## Platforms

*Projects that can be used to host a CTF*

- ⭐️ 6,511 [CTFd](https://github.com/isislab/CTFd) - Platform to host jeopardy style CTFs from ISISLab, NYU Tandon.
- ⭐️ 144 [echoCTF.RED](https://github.com/echoCTF/echoCTF.RED) - Develop, deploy and maintain your own CTF infrastructure.
- ⭐️ 6,570 [FBCTF](https://github.com/facebook/fbctf) - Platform to host Capture the Flag competitions from Facebook.
- ⭐️ 195 [Haaukins](https://github.com/aau-network-security/haaukins)- A Highly Accessible and Automated Virtualization Platform for Security Education.
- ⭐️ 72 [HackTheArch](https://github.com/mcpa-stlouis/hack-the-arch) - CTF scoring platform.
- ⭐️ 454 [Mellivora](https://github.com/Nakiami/mellivora) - A CTF engine written in PHP.
- ⭐️ 50 [MotherFucking-CTF](https://github.com/andreafioraldi/motherfucking-ctf) - Badass lightweight plaform to host CTFs. No JS involved.
- ⭐️ 125 [NightShade](https://github.com/UnrealAkama/NightShade) - A simple security CTF framework.
- ⭐️ 83 [OpenCTF](https://github.com/easyctf/openctf) - CTF in a box. Minimal setup required.
- ⭐️ 310 [PicoCTF](https://github.com/picoCTF/picoCTF) - The platform used to run picoCTF. A great framework to host any CTF.
- ⭐️ 118 [PyChallFactory](https://github.com/pdautry/py_chall_factory) - Small framework to create/manage/package jeopardy CTF challenges.
- ⭐️ 1,084 [RootTheBox](https://github.com/moloch--/RootTheBox) - A Game of Hackers (CTF Scoreboard & Game Manager).
- ⭐️ 51 [Scorebot](https://github.com/legitbs/scorebot) - Platform for CTFs by Legitbs (Defcon).
- ⭐️ 2,744 [SecGen](https://github.com/cliffe/SecGen) - Security Scenario Generator. Creates randomly vulnerable virtual machines.

## Steganography

*Tools used to create stego challenges*

Check solve section for steganography.

## Web

*Tools used for creating Web challenges*

*JavaScript Obfustcators*

- ⭐️ 37,493 [Metasploit JavaScript Obfuscator](https://github.com/rapid7/metasploit-framework)
- ⭐️ 13,398 [Uglify](https://github.com/mishoo/UglifyJS)


# Solve

*Tools used for solving CTF challenges*

## Attacks

*Tools used for performing various kinds of attacks*

- ⭐️ 18,818 [Bettercap](https://github.com/bettercap/bettercap) - Framework to perform MITM (Man in the Middle) attacks.
- ⭐️ 830 [Yersinia](https://github.com/tomac/yersinia) - Attack various protocols on layer 2.

## Crypto

*Tools used for solving Crypto challenges*

- [CyberChef](https://gchq.github.io/CyberChef) - Web app for analysing and decoding data.
- ⭐️ 1,117 [FeatherDuster](https://github.com/nccgroup/featherduster) - An automated, modular cryptanalysis tool.
- ⭐️ 1,180 [Hash Extender](https://github.com/iagox86/hash_extender) - A utility tool for performing hash length extension attacks.
- ⭐️ 220 [padding-oracle-attacker](https://github.com/KishanBagaria/padding-oracle-attacker) - A CLI tool to execute padding oracle attacks.
- [PkCrack](https://www.unix-ag.uni-kl.de/~conrad/krypto/pkcrack.html) - A tool for Breaking PkZip-encryption.
- [QuipQuip](https://quipqiup.com) - An online tool for breaking substitution ciphers or vigenere ciphers (without key).
- ⭐️ 6,761 [RSACTFTool](https://github.com/Ganapati/RsaCtfTool) - A tool for recovering RSA private key with various attack.
- ⭐️ 1,554 [RSATool](https://github.com/ius/rsatool) - Generate private key with knowledge of p and q.
- ⭐️ 1,474 [XORTool](https://github.com/hellman/xortool) - A tool to analyze multi-byte xor cipher.

## Bruteforcers

*Tools used for various kind of bruteforcing (passwords etc.)*

- [Hashcat](https://hashcat.net/hashcat/) - Password Cracker
- [Hydra](https://tools.kali.org/password-attacks/hydra) - A parallelized login cracker which supports numerous protocols to attack
- ⭐️ 12,699 [John The Jumbo](https://github.com/magnumripper/JohnTheRipper) - Community enhanced version of John the Ripper.
- [John The Ripper](http://www.openwall.com/john/) - Password Cracker.
- ⭐️ 65 [Nozzlr](https://github.com/intrd/nozzlr) - Nozzlr is a bruteforce framework, trully modular and script-friendly.
- [Ophcrack](http://ophcrack.sourceforge.net/) - Windows password cracker based on rainbow tables.
- ⭐️ 3,845 [Patator](https://github.com/lanjelot/patator) - Patator is a multi-purpose brute-forcer, with a modular design.
- [Turbo Intruder](https://portswigger.net/research/turbo-intruder-embracing-the-billion-request-attack) - Burp Suite extension for sending large numbers of HTTP requests 

## Exploits

*Tools used for solving Exploits challenges*

- ⭐️ 501 [DLLInjector](https://github.com/OpenSecurityResearch/dllinjector) - Inject dlls in processes.
- ⭐️ 346 [libformatstr](https://github.com/hellman/libformatstr) - Simplify format string exploitation.
- [Metasploit](http://www.metasploit.com/) - Penetration testing software.
  - [Cheatsheet](https://www.comparitech.com/net-admin/metasploit-cheat-sheet/)
- ⭐️ 2,296 [one_gadget](https://github.com/david942j/one_gadget) -  A tool to find the one gadget `execve('/bin/sh', NULL, NULL)` call.
  - `gem install one_gadget`
- ⭐️ 13,244 [Pwntools](https://github.com/Gallopsled/pwntools) - CTF Framework for writing exploits.
- ⭐️ 4,063 [Qira](https://github.com/BinaryAnalysisPlatform/qira) - QEMU Interactive Runtime Analyser.
- ⭐️ 4,369 [ROP Gadget](https://github.com/JonathanSalwan/ROPgadget) - Framework for ROP exploitation.
- ⭐️ 372 [V0lt](https://github.com/P1kachu/v0lt) - Security CTF Toolkit.

## Forensics

*Tools used for solving Forensics challenges*

- [Aircrack-Ng](http://www.aircrack-ng.org/) - Crack 802.11 WEP and WPA-PSK keys.
  - `apt-get install aircrack-ng`
- [Audacity](http://sourceforge.net/projects/audacity/) - Analyze sound files (mp3, m4a, whatever).
  - `apt-get install audacity`
- [Bkhive and Samdump2](http://sourceforge.net/projects/ophcrack/files/samdump2/) - Dump SYSTEM and SAM files.
  - `apt-get install samdump2 bkhive`
- [CFF Explorer](http://www.ntcore.com/exsuite.php) - PE Editor.
- ⭐️ 281 [Creddump](https://github.com/moyix/creddump) - Dump windows credentials.
- ⭐️ 1,777 [DVCS Ripper](https://github.com/kost/dvcs-ripper) - Rips web accessible (distributed) version control systems.
- [Exif Tool](http://www.sno.phy.queensu.ca/~phil/exiftool/) - Read, write and edit file metadata.
- [Extundelete](http://extundelete.sourceforge.net/) - Used for recovering lost data from mountable images.
- ⭐️ 2,428 [Fibratus](https://github.com/rabbitstack/fibratus) - Tool for exploration and tracing of the Windows kernel.
- [Foremost](http://foremost.sourceforge.net/) - Extract particular kind of files using headers.
  - `apt-get install foremost`
- [Fsck.ext4](http://linux.die.net/man/8/fsck.ext3) - Used to fix corrupt filesystems.
- [Malzilla](http://malzilla.sourceforge.net/) - Malware hunting tool.
- [NetworkMiner](http://www.netresec.com/?page=NetworkMiner) - Network Forensic Analysis Tool.
- [PDF Streams Inflater](http://malzilla.sourceforge.net/downloads.html) - Find and extract zlib files compressed in PDF files.
- [Pngcheck](http://www.libpng.org/pub/png/apps/pngcheck.html) - Verifies the integrity of PNG and dump all of the chunk-level information in human-readable form.
  - `apt-get install pngcheck`
- [ResourcesExtract](http://www.nirsoft.net/utils/resources_extract.html) - Extract various filetypes from exes.
- ⭐️ 160 [Shellbags](https://github.com/williballenthin/shellbags) - Investigate NT\_USER.dat files.
- [Snow](https://sbmlabs.com/notes/snow_whitespace_steganography_tool) - A Whitespace Steganography Tool.
- ⭐️ 1,178 [USBRip](https://github.com/snovvcrash/usbrip) - Simple CLI forensics tool for tracking USB device artifacts (history of USB events) on GNU/Linux.
- ⭐️ 7,962 [Volatility](https://github.com/volatilityfoundation/volatility) - To investigate memory dumps.
- [Wireshark](https://www.wireshark.org) - Used to analyze pcap or pcapng files

*Registry Viewers*
- [OfflineRegistryView](https://www.nirsoft.net/utils/offline_registry_view.html) - Simple tool for Windows that allows you to read offline Registry files from external drive and view the desired Registry key in .reg file format.
- [Registry Viewer®](https://accessdata.com/product-download/registry-viewer-2-0-0) - Used to view Windows registries.

## Networking

*Tools used for solving Networking challenges*

- ⭐️ 25,311 [Masscan](https://github.com/robertdavidgraham/masscan) - Mass IP port scanner, TCP port scanner.
- [Monit](https://linoxide.com/monitoring-2/monit-linux/) - A linux tool to check a host on the network (and other non-network activities).
- ⭐️ 2,285 [Nipe](https://github.com/GouveaHeitor/nipe) - Nipe is a script to make Tor Network your default gateway.
- [Nmap](https://nmap.org/) - An open source utility for network discovery and security auditing.
- [Wireshark](https://www.wireshark.org/) - Analyze the network dumps.
  - `apt-get install wireshark`
- [Zeek](https://www.zeek.org) - An open-source network security monitor.
- [Zmap](https://zmap.io/) - An open-source network scanner.

## Reversing

*Tools used for solving Reversing challenges*

- ⭐️ 5,950 [Androguard](https://github.com/androguard/androguard) - Reverse engineer Android applications.
- ⭐️ 8,487 [Angr](https://github.com/angr/angr) - platform-agnostic binary analysis framework.
- ⭐️ 688 [Apk2Gold](https://github.com/lxdvs/apk2gold) - Yet another Android decompiler.
- [ApkTool](http://ibotpeaches.github.io/Apktool/) - Android Decompiler.
- ⭐️ 1,445 [Barf](https://github.com/programa-stic/barf-project) - Binary Analysis and Reverse engineering Framework.
- [Binary Ninja](https://binary.ninja/) - Binary analysis framework.
- [BinUtils](http://www.gnu.org/software/binutils/binutils.html) - Collection of binary tools.
- ⭐️ 13,570 [BinWalk](https://github.com/devttys0/binwalk) - Analyze, reverse engineer, and extract firmware images.
- ⭐️ 399 [Boomerang](https://github.com/BoomerangDecompiler/boomerang) - Decompile x86/SPARC/PowerPC/ST-20 binaries to C.
- ⭐️ 113 [ctf_import](https://github.com/docileninja/ctf_import) – run basic functions from stripped binaries cross platform.
- ⭐️ 1,317 [cwe_checker](https://github.com/fkie-cad/cwe_checker) - cwe_checker finds vulnerable patterns in binary executables.
- ⭐️ 754 [demovfuscator](https://github.com/kirschju/demovfuscator) - A work-in-progress deobfuscator for movfuscated binaries.
- [Frida](https://github.com/frida/) - Dynamic Code Injection.
- [GDB](https://www.gnu.org/software/gdb/) - The GNU project debugger.
- ⭐️ 8,006 [GEF](https://github.com/hugsy/gef) - GDB plugin.
- [Ghidra](https://ghidra-sre.org/) - Open Source suite of reverse engineering tools.  Similar to IDA Pro.
- [Hopper](http://www.hopperapp.com/) - Reverse engineering tool (disassembler) for OSX and Linux.
- [IDA Pro](https://www.hex-rays.com/products/ida/) - Most used Reversing software.
- ⭐️ 47,261 [Jadx](https://github.com/skylot/jadx) - Decompile Android files.
- [Java Decompilers](http://www.javadecompilers.com) - An online decompiler for Java and Android APKs.
- ⭐️ 2,176 [Krakatau](https://github.com/Storyyeller/Krakatau) - Java decompiler and disassembler.
- ⭐️ 8,884 [Objection](https://github.com/sensepost/objection) - Runtime Mobile Exploration.
- ⭐️ 6,098 [PEDA](https://github.com/longld/peda) - GDB plugin (only python2.7).
- [Pin](https://software.intel.com/en-us/articles/pin-a-dynamic-binary-instrumentation-tool) - A dynamic binary instrumentaion tool by Intel.
- ⭐️ 2,741 [PINCE](https://github.com/korcankaraokcu/PINCE) - GDB front-end/reverse engineering tool, focused on game-hacking and automation.
- ⭐️ 508 [PinCTF](https://github.com/ChrisTheCoolHut/PinCTF) - A tool which uses intel pin for Side Channel Analysis.
- ⭐️ 3,063 [Plasma](https://github.com/joelpx/plasma) - An interactive disassembler for x86/ARM/MIPS which can generate indented pseudo-code with colored syntax.
- ⭐️ 9,990 [Pwndbg](https://github.com/pwndbg/pwndbg) - A GDB plugin that provides a suite of utilities to hack around GDB easily.
- ⭐️ 23,069 [radare2](https://github.com/radare/radare2) - A portable reversing framework.
- ⭐️ 4,046 [Triton](https://github.com/JonathanSalwan/Triton) - Dynamic Binary Analysis (DBA) framework.
- ⭐️ 426 [Uncompyle](https://github.com/gstarnberger/uncompyle) - Decompile Python 2.7 binaries (.pyc).
- [WinDbg](http://www.windbg.org/) - Windows debugger distributed by Microsoft.
- [Xocopy](http://reverse.lostrealm.com/tools/xocopy.html) - Program that can copy executables with execute, but no read permission.
- ⭐️ 11,900 [Z3](https://github.com/Z3Prover/z3) - A theorem prover from Microsoft Research.

*JavaScript Deobfuscators*

- [Detox](http://relentless-coding.org/projects/jsdetox/install) - A Javascript malware analysis tool.
- [Revelo](http://www.kahusecurity.com/posts/revelo_javascript_deobfuscator.html) - Analyze obfuscated Javascript code.

*SWF Analyzers*
- ⭐️ 447 [RABCDAsm](https://github.com/CyberShadow/RABCDAsm) - Collection of utilities including an ActionScript 3 assembler/disassembler.
- [Swftools](http://www.swftools.org/) - Collection of utilities to work with SWF files.
- [Xxxswf](https://bitbucket.org/Alexander_Hanel/xxxswf) -  A Python script for analyzing Flash files.

## Services

*Various kind of useful services available around the internet*

- [CSWSH](http://cow.cat/cswsh.html) - Cross-Site WebSocket Hijacking Tester.
- [Request Bin](https://requestbin.com/) - Lets you inspect http requests to a particular url.

## Steganography

*Tools used for solving Steganography challenges*

- [AperiSolve](https://aperisolve.fr/) - Aperi'Solve is a platform which performs layer analysis on image (open-source).
- [Convert](http://www.imagemagick.org/script/convert.php) - Convert images b/w formats and apply filters.
- [Exif](http://manpages.ubuntu.com/manpages/trusty/man1/exif.1.html) - Shows EXIF information in JPEG files.
- [Exiftool](https://linux.die.net/man/1/exiftool) - Read and write meta information in files.
- [Exiv2](http://www.exiv2.org/manpage.html) - Image metadata manipulation tool.
- [Image Steganography](https://sourceforge.net/projects/image-steg/) - Embeds text and files in images with optional encryption. Easy-to-use UI.
- [Image Steganography Online](https://incoherency.co.uk/image-steganography) - This is a client-side Javascript tool to steganographically hide images inside the lower "bits" of other images
- [ImageMagick](http://www.imagemagick.org/script/index.php) - Tool for manipulating images.
- [Outguess](https://www.freebsd.org/cgi/man.cgi?query=outguess+&apropos=0&sektion=0&manpath=FreeBSD+Ports+5.1-RELEASE&format=html) - Universal steganographic tool.
- [Pngtools](https://packages.debian.org/sid/pngtools) - For various analysis related to PNGs.
  - `apt-get install pngtools`
- ⭐️ 2,394 [SmartDeblur](https://github.com/Y-Vladimir/SmartDeblur) - Used to deblur and fix defocused images.
- [Steganabara](https://www.openhub.net/p/steganabara) -  Tool for stegano analysis written in Java.
- [SteganographyOnline](https://stylesuxx.github.io/steganography/) - Online steganography encoder and decoder.
- [Stegbreak](https://linux.die.net/man/1/stegbreak) - Launches brute-force dictionary attacks on JPG image.
- ⭐️ 588 [StegCracker](https://github.com/Paradoxis/StegCracker) - Steganography brute-force utility to uncover hidden data inside files.
- ⭐️ 126 [stegextract](https://github.com/evyatarmeged/stegextract) - Detect hidden files and text in images.
- [Steghide](http://steghide.sourceforge.net/) - Hide data in various kind of images.
- [StegOnline](https://georgeom.net/StegOnline/upload) - Conduct a wide range of image steganography operations, such as concealing/revealing files hidden within bits (open-source).
- [Stegsolve](http://www.caesum.com/handbook/Stegsolve.jar) - Apply various steganography techniques to images.
- ⭐️ 1,537 [Zsteg](https://github.com/zed-0xff/zsteg) - PNG/BMP analysis.

## Web

*Tools used for solving Web challenges*

- [BurpSuite](https://portswigger.net/burp) - A graphical tool to testing website security.
- ⭐️ 5,622 [Commix](https://github.com/commixproject/commix) - Automated All-in-One OS Command Injection and Exploitation Tool.
- [Hackbar](https://addons.mozilla.org/en-US/firefox/addon/hackbartool/) - Firefox addon for easy web exploitation.
- [OWASP ZAP](https://www.owasp.org/index.php/Projects/OWASP_Zed_Attack_Proxy_Project) - Intercepting proxy to replay, debug, and fuzz HTTP requests and responses
- [Postman](https://chrome.google.com/webstore/detail/postman/fhbjgbiflinjbdggehcddcbncdddomop?hl=en) - Add on for chrome for debugging network requests.
- ⭐️ 3,508 [Raccoon](https://github.com/evyatarmeged/Raccoon) - A high performance offensive security tool for reconnaissance and vulnerability scanning.
- ⭐️ 36,571 [SQLMap](https://github.com/sqlmapproject/sqlmap) - Automatic SQL injection and database takeover tool.
  ```pip install sqlmap```
- ⭐️ 4,853 [W3af](https://github.com/andresriancho/w3af) -  Web Application Attack and Audit Framework.
- [XSSer](http://xsser.sourceforge.net/) - Automated XSS testor.


# Resources

*Where to discover about CTF*

## Operating Systems

*Penetration testing and security lab Operating Systems*

- [Android Tamer](https://androidtamer.com/) - Based on Debian.
- [BackBox](https://backbox.org/) - Based on Ubuntu.
- [BlackArch Linux](https://blackarch.org/) - Based on Arch Linux.
- [Fedora Security Lab](https://labs.fedoraproject.org/security/) - Based on Fedora.
- [Kali Linux](https://www.kali.org/) - Based on Debian.
- [Parrot Security OS](https://www.parrotsec.org/) - Based on Debian.
- [Pentoo](http://www.pentoo.ch/) - Based on Gentoo.
- [URIX OS](http://urix.us/) - Based on openSUSE.
- [Wifislax](http://www.wifislax.com/) - Based on Slackware.

*Malware analysts and reverse-engineering*

- ⭐️ 8,336 [Flare VM](https://github.com/fireeye/flare-vm) - Based on Windows.
- [REMnux](https://remnux.org/) - Based on Debian.

## Starter Packs

*Collections of installer scripts, useful tools*

- ⭐️ 9,284 [CTF Tools](https://github.com/zardus/ctf-tools) - Collection of setup scripts to install various security research tools.
- ⭐️ 48 [LazyKali](https://github.com/jlevitsk/lazykali) - A 2016 refresh of LazyKali which simplifies install of tools and configuration.

## Tutorials

*Tutorials to learn how to play CTFs*

- [CTF Field Guide](https://trailofbits.github.io/ctf/) - Field Guide by Trails of Bits.
- [CTF Resources](http://ctfs.github.io/resources/) -  Start Guide maintained by community.
- [How to Get Started in CTF](https://www.endgame.com/blog/how-get-started-ctf) - Short guideline for CTF beginners by Endgame
- [Intro. to CTF Course](https://www.hoppersroppers.org/courseCTF.html) - A free course that teaches beginners the basics of forensics, crypto, and web-ex.
- [IppSec](https://www.youtube.com/channel/UCa6eh7gCkpPo5XXUDfygQQA) - Video tutorials and walkthroughs of popular CTF platforms.
- [LiveOverFlow](https://www.youtube.com/channel/UClcE-kVhqyiHCcjYwcpfj9w) - Video tutorials on Exploitation.
- ⭐️ 278 [MIPT CTF](https://github.com/xairy/mipt-ctf) - A small course for beginners in CTFs (in Russian).


## Wargames

*Always online CTFs*

- [Backdoor](https://backdoor.sdslabs.co/) - Security Platform by SDSLabs.
- [Crackmes](https://crackmes.one/) - Reverse Engineering Challenges.
- [CryptoHack](https://cryptohack.org/) - Fun cryptography challenges.
- [echoCTF.RED](https://echoctf.red/) - Online CTF with a variety of targets to attack.
- [Exploit Exercises](https://exploit-exercises.lains.space/) - Variety of VMs to learn variety of computer security issues.
- [Exploit.Education](http://exploit.education) - Variety of VMs to learn variety of computer security issues.
- ⭐️ 13 [Gracker](https://github.com/Samuirai/gracker) - Binary challenges having a slow learning curve, and write-ups for each level.
- [Hack The Box](https://www.hackthebox.eu) - Weekly CTFs for all types of security enthusiasts.
- [Hack This Site](https://www.hackthissite.org/) - Training ground for hackers.
- [Hacker101](https://www.hacker101.com/) - CTF from HackerOne
- [Hacking-Lab](https://hacking-lab.com/) - Ethical hacking, computer network and security challenge platform.
- [Hone Your Ninja Skills](https://honeyourskills.ninja/) - Web challenges starting from basic ones.
- [IO](http://io.netgarage.org/) - Wargame for binary challenges.
- [Microcorruption](https://microcorruption.com) - Embedded security CTF.
- [Over The Wire](http://overthewire.org/wargames/) - Wargame maintained by OvertheWire Community.
- [PentesterLab](https://pentesterlab.com/) - Variety of VM and online challenges (paid).
- [PicoCTF](https://2019game.picoctf.com) - All year round ctf game. Questions from the yearly picoCTF competition.
- [PWN Challenge](http://pwn.eonew.cn/) - Binary Exploitation Wargame.
- [Pwnable.kr](http://pwnable.kr/) - Pwn Game.
- [Pwnable.tw](https://pwnable.tw/) - Binary wargame.
- [Pwnable.xyz](https://pwnable.xyz/) - Binary Exploitation Wargame.
- [Reversin.kr](http://reversing.kr/) - Reversing challenge.
- [Ringzer0Team](https://ringzer0team.com/) - Ringzer0 Team Online CTF.
- [Root-Me](https://www.root-me.org/) - Hacking and Information Security learning platform.
- ⭐️ 27 [ROP Wargames](https://github.com/xelenonz/game) - ROP Wargames.
- [SANS HHC](https://holidayhackchallenge.com/past-challenges/) - Challenges with a holiday theme
  released annually and maintained by SANS.
- [SmashTheStack](http://smashthestack.org/) - A variety of wargames maintained by the SmashTheStack Community.
- [Viblo CTF](https://ctf.viblo.asia) - Various amazing CTF challenges, in many different categories. Has both Practice mode and Contest mode.
- [VulnHub](https://www.vulnhub.com/) - VM-based for practical in digital security, computer application & network administration.
- [W3Challs](https://w3challs.com) - A penetration testing training platform, which offers various computer challenges, in various categories.
- [WebHacking](http://webhacking.kr) - Hacking challenges for web.


*Self-hosted CTFs*
- [Damn Vulnerable Web Application](http://www.dvwa.co.uk/) - PHP/MySQL web application that is damn vulnerable.
- ⭐️ 461 [Juice Shop CTF](https://github.com/bkimminich/juice-shop-ctf) - Scripts and tools for hosting a CTF on [OWASP Juice Shop](https://www.owasp.org/index.php/OWASP_Juice_Shop_Project) easily.

## Websites

*Various general websites about and on CTF*

- ⭐️ 122 [Awesome CTF Cheatsheet](https://github.com/uppusaikiran/awesome-ctf-cheatsheet) - CTF Cheatsheet.
- [CTF Time](https://ctftime.org/) - General information on CTF occuring around the worlds.
- [Reddit Security CTF](http://www.reddit.com/r/securityctf) - Reddit CTF category.

## Wikis

*Various Wikis available for learning about CTFs*

- [Bamboofox](https://bamboofox.github.io/) - Chinese resources to learn CTF.
- [bi0s Wiki](https://teambi0s.gitlab.io/bi0s-wiki/) - Wiki from team bi0s.
- [CTF Cheatsheet](https://uppusaikiran.github.io/hacking/Capture-the-Flag-CheatSheet/) - CTF tips and tricks.
- ⭐️ 384 [ISIS Lab](https://github.com/isislab/Project-Ideas) - CTF Wiki by Isis lab.
- ⭐️ 152 [OpenToAll](https://github.com/OpenToAllCTF/Tips) - CTF tips by OTA CTF team members.

## Writeups Collections

*Collections of CTF write-ups*

- ⭐️ 101 [0e85dc6eaf](https://github.com/0e85dc6eaf/CTF-Writeups) - Write-ups for CTF challenges by 0e85dc6eaf
- [Captf](http://captf.com/) - Dumped CTF challenges and materials by psifertex.
- [CTF write-ups (community)](https://github.com/ctfs/) - CTF challenges + write-ups archive maintained by the community.
- ⭐️ 39 [CTFTime Scrapper](https://github.com/abdilahrf/CTFWriteupScrapper) - Scraps all writeup from CTF Time and organize which to read first.
- ⭐️ 259 [HackThisSite](https://github.com/HackThisSite/CTF-Writeups) - CTF write-ups repo maintained by HackThisSite team.
- ⭐️ 123 [Mzfr](https://github.com/mzfr/ctf-writeups) - CTF competition write-ups by mzfr
- ⭐️ 518 [pwntools writeups](https://github.com/Gallopsled/pwntools-write-ups) - A collection of CTF write-ups all using pwntools.
- ⭐️ 22 [SababaSec](https://github.com/SababaSec/ctf-writeups) - A collection of CTF write-ups by the SababaSec team
- [Shell Storm](http://shell-storm.org/repo/CTF/) - CTF challenge archive maintained by Jonathan Salwan.
- ⭐️ 190 [Smoke Leet Everyday](https://github.com/smokeleeteveryday/CTF_WRITEUPS) - CTF write-ups repo maintained by SmokeLeetEveryday team.

### LICENSE

CC0 :)
