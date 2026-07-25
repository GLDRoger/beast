#!/usr/bin/env python3
"""Generate a Windows yt-dlp setup guide PDF."""

from pathlib import Path

from fpdf import FPDF


class GuidePDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(100, 100, 100)
        self.cell(0, 8, "Download Audio from Uppbeat (and similar sites) on Windows", align="R")
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 9)
        self.set_text_color(120, 120, 120)
        self.cell(0, 10, f"Page {self.page_no()}", align="C")

    def section_title(self, text: str):
        self.ln(4)
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(20, 60, 120)
        self.multi_cell(0, 9, text)
        self.ln(2)

    def subsection_title(self, text: str):
        self.ln(2)
        self.set_font("Helvetica", "B", 12)
        self.set_text_color(30, 30, 30)
        self.multi_cell(0, 7, text)
        self.ln(1)

    def body(self, text: str):
        self.set_font("Helvetica", "", 11)
        self.set_text_color(30, 30, 30)
        self.multi_cell(0, 6, text)
        self.ln(2)

    def bullet(self, text: str):
        self.set_font("Helvetica", "", 11)
        self.set_text_color(30, 30, 30)
        self.multi_cell(0, 6, f"  -  {text}")
        self.ln(1)

    def numbered(self, number: int, text: str):
        self.set_font("Helvetica", "", 11)
        self.set_text_color(30, 30, 30)
        self.multi_cell(0, 6, f"  {number}.  {text}")
        self.ln(1)

    def code_block(self, text: str):
        self.set_fill_color(245, 245, 245)
        self.set_draw_color(210, 210, 210)
        self.set_font("Courier", "", 10)
        self.set_text_color(20, 20, 20)
        for line in text.split("\n"):
            self.cell(0, 6, f"  {line}", border=0, fill=True, new_x="LMARGIN", new_y="NEXT")
        self.ln(3)

    def note(self, text: str):
        self.set_font("Helvetica", "I", 10)
        self.set_text_color(80, 80, 80)
        self.multi_cell(0, 5, f"Note: {text}")
        self.ln(2)


def build_pdf(output_path: Path) -> None:
    pdf = GuidePDF()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.set_margins(20, 20, 20)
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 22)
    pdf.set_text_color(20, 60, 120)
    pdf.multi_cell(0, 11, "How to Download Audio from Uppbeat on Windows")
    pdf.ln(2)
    pdf.set_font("Helvetica", "", 12)
    pdf.set_text_color(60, 60, 60)
    pdf.multi_cell(
        0,
        7,
        "A step-by-step guide for saving sound effects and other media to your laptop "
        "using yt-dlp and a page URL (for example, an Uppbeat SFX link).",
    )
    pdf.ln(4)

    pdf.section_title("What you need")
    pdf.body(
        "yt-dlp is a free command-line tool that downloads media from many websites. "
        "For Uppbeat links, you only need yt-dlp itself. You do not need to sign in, "
        "install a browser extension, or copy hidden CDN links."
    )
    pdf.bullet("A Windows 10 or Windows 11 laptop")
    pdf.bullet("An internet connection")
    pdf.bullet("About 5 minutes for first-time setup")
    pdf.bullet("The page URL of the sound you want (example below)")

    pdf.code_block(
        "https://uppbeat.io/sfx/rise-finger-snap/164384/48195"
    )

    pdf.section_title("Step 1: Install yt-dlp")
    pdf.body("Pick one method below. Method A is usually the easiest on modern Windows.")

    pdf.subsection_title("Method A - winget (recommended)")
    pdf.numbered(1, "Press the Windows key and type PowerShell.")
    pdf.numbered(2, "Right-click Windows PowerShell and choose Run as administrator.")
    pdf.numbered(3, "Run this command:")
    pdf.code_block("winget install yt-dlp.yt-dlp")
    pdf.numbered(4, "Close PowerShell, then open a new PowerShell or Command Prompt window.")

    pdf.subsection_title("Method B - Download the .exe file")
    pdf.numbered(1, "Open this page in your browser:")
    pdf.code_block("https://github.com/yt-dlp/yt-dlp/releases/latest")
    pdf.numbered(2, "Download the file named yt-dlp.exe.")
    pdf.numbered(3, "Create a folder such as C:\\Tools\\yt-dlp")
    pdf.numbered(4, "Move yt-dlp.exe into that folder.")
    pdf.numbered(5, "Add the folder to your PATH so Windows can find the program:")
    pdf.bullet("Press Windows key, search for Environment Variables, and open Edit the system environment variables.")
    pdf.bullet("Click Environment Variables.")
    pdf.bullet("Under User variables, select Path, then Edit, then New.")
    pdf.bullet("Add C:\\Tools\\yt-dlp (or your chosen folder), then click OK on every window.")
    pdf.numbered(6, "Open a new PowerShell or Command Prompt window.")

    pdf.subsection_title("Method C - Python pip")
    pdf.body("Use this only if you already use Python on your laptop.")
    pdf.code_block("py -m pip install -U yt-dlp")

    pdf.section_title("Step 2: Verify the install")
    pdf.body("Open a new PowerShell or Command Prompt window and run:")
    pdf.code_block("yt-dlp --version")
    pdf.body(
        "If you see a version number (for example 2025.xx.xx), the install worked. "
        "If Windows says the command is not recognized, restart the terminal or confirm "
        "your PATH setup from Method B."
    )

    pdf.section_title("Step 3: Download audio from a URL")
    pdf.body(
        "Paste the full Uppbeat page URL into the command below. yt-dlp will fetch the "
        "audio file and save it in your current folder."
    )
    pdf.code_block('yt-dlp "https://uppbeat.io/sfx/rise-finger-snap/164384/48195"')
    pdf.body(
        "When it finishes, look in the folder where you ran the command. "
        "You should see an .mp3 file with the track title in the filename."
    )
    pdf.note(
        "Keep the quotes around the URL. They prevent Windows from breaking the link "
        "when the address contains special characters."
    )

    pdf.section_title("Step 4: Save files to a specific folder")
    pdf.body(
        "To always save downloads into your Downloads folder, use the -P option for path "
        "and -o for the filename pattern."
    )
    pdf.code_block(
        'yt-dlp -P "%USERPROFILE%\\Downloads" -o "%(title)s.%(ext)s" '
        '"https://uppbeat.io/sfx/rise-finger-snap/164384/48195"'
    )
    pdf.body(
        "%USERPROFILE%\\Downloads is the standard Windows Downloads folder for the "
        "signed-in user. After the command completes, open Downloads in File Explorer."
    )

    pdf.subsection_title("Use a custom filename")
    pdf.code_block(
        'yt-dlp -P "%USERPROFILE%\\Downloads" -o "rise-finger-snap.%(ext)s" '
        '"https://uppbeat.io/sfx/rise-finger-snap/164384/48195"'
    )

    pdf.section_title("Step 5: Download multiple URLs")
    pdf.body("Create a text file listing one URL per line, then run:")
    pdf.code_block(
        "notepad urls.txt\n\n"
        'yt-dlp -P "%USERPROFILE%\\Downloads" -a urls.txt'
    )
    pdf.body(
        "Each line in urls.txt should be a full page URL. yt-dlp will download them one "
        "after another into your chosen folder."
    )

    pdf.section_title("Quick reference")
    pdf.code_block(
        "# Check version\n"
        "yt-dlp --version\n\n"
        "# Basic download\n"
        'yt-dlp "PASTE_URL_HERE"\n\n'
        "# Save to Downloads with a clean name\n"
        'yt-dlp -P "%USERPROFILE%\\Downloads" -o "%(title)s.%(ext)s" "PASTE_URL_HERE"\n\n'
        "# Download every URL in a text file\n"
        'yt-dlp -P "%USERPROFILE%\\Downloads" -a urls.txt'
    )

    pdf.section_title("Troubleshooting")
    pdf.subsection_title("'yt-dlp' is not recognized")
    pdf.bullet("Close the terminal and open a new one.")
    pdf.bullet("If you used Method B, confirm the folder containing yt-dlp.exe is in PATH.")
    pdf.bullet("Try running the full path, for example: C:\\Tools\\yt-dlp\\yt-dlp.exe --version")

    pdf.subsection_title("Download fails or says HTTP Error 429")
    pdf.bullet("Wait a minute and try again.")
    pdf.bullet("Make sure you are using the page URL, not a partial link.")
    pdf.bullet("Update yt-dlp: yt-dlp -U (or reinstall with winget).")

    pdf.subsection_title("File saved somewhere unexpected")
    pdf.bullet("Files save to the folder shown in the terminal prompt unless you use -P.")
    pdf.bullet("Use -P \"%USERPROFILE%\\Downloads\" to force the Downloads folder.")

    pdf.subsection_title("PowerShell blocks the command")
    pdf.bullet("Use Command Prompt (cmd.exe) instead, or run PowerShell as your normal user.")
    pdf.bullet("Keep quotes around the URL exactly as shown in this guide.")

    pdf.section_title("License reminder for Uppbeat")
    pdf.body(
        "Uppbeat provides free sound effects under terms that usually require attribution "
        "when you publish your project. Check the license shown on the Uppbeat page before "
        "using the audio in videos, apps, or client work."
    )

    pdf.section_title("You are done")
    pdf.body(
        "Once yt-dlp is installed, the usual workflow is: copy a page URL, run one command, "
        "and collect the .mp3 from your Downloads folder. No manual file hunting required."
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(output_path))


if __name__ == "__main__":
    out = Path.home() / "Downloads" / "Download-Audio-from-Uppbeat-Windows-Guide.pdf"
    build_pdf(out)
    print(out)