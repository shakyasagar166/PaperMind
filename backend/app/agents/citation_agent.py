import re
from typing import Dict, Any, Optional

class CitationAgent:
    """Agent responsible for citation generation, reference formatting, and claim validation."""

    def generate_bibtex(
        self,
        title: str,
        authors: Optional[str] = "",
        year: Optional[int] = None,
        journal_or_venue: Optional[str] = "arXiv preprint"
    ) -> str:
        """Construct standard BibTeX citation string."""
        first_author = authors.split(",")[0].split(" ")[-1].lower() if authors else "author"
        year_val = year or 2024
        clean_title_key = re.sub(r'[^a-zA-Z0-9]', '', title)[:15].lower()
        cite_key = f"{first_author}{year_val}{clean_title_key}"

        return (
            f"@article{{{cite_key},\n"
            f"  title = {{{title}}},\n"
            f"  author = {{{authors or 'Unknown Authors'}}},\n"
            f"  year = {{{year_val}}},\n"
            f"  journal = {{{journal_or_venue}}}\n"
            f"}}"
        )

    def generate_apa(
        self,
        title: str,
        authors: Optional[str] = "",
        year: Optional[int] = None
    ) -> str:
        """Construct APA format citation."""
        auth = authors if authors else "Unknown Authors"
        yr = f"({year})" if year else "(n.d.)"
        return f"{auth} {yr}. {title}."

    def generate_ieee(
        self,
        title: str,
        authors: Optional[str] = "",
        year: Optional[int] = None
    ) -> str:
        """Construct IEEE format citation."""
        auth = authors if authors else "U. Authors"
        yr = str(year) if year else "n.d."
        return f'{auth}, "{title}," {yr}.'

    def format_all(self, title: str, authors: Optional[str] = "", year: Optional[int] = None) -> Dict[str, str]:
        """Return citations in all standard formats."""
        return {
            "bibtex": self.generate_bibtex(title, authors, year),
            "apa": self.generate_apa(title, authors, year),
            "ieee": self.generate_ieee(title, authors, year),
        }

_citation_agent: Optional[CitationAgent] = None

def get_citation_agent() -> CitationAgent:
    global _citation_agent
    if _citation_agent is None:
        _citation_agent = CitationAgent()
    return _citation_agent
