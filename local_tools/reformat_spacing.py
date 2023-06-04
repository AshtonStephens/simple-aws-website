import sys

def change_tab_size_on_line(original_line, old_tab_size, new_tab_size):
    original_line_no_tabs = original_line.lstrip()
    if len(original_line_no_tabs) == 0:
        return "\n"
    num_old_tabs = int((len(original_line) - len(original_line_no_tabs)) / old_tab_size)
    new_line = ((" " * new_tab_size) * num_old_tabs) + original_line_no_tabs
    return new_line

def change_tab_size(file_name, old_tab_size, new_tab_size):
    """
    Change the tab size of a file.

    Args:
    file_name: The name of the file to change the tab size of.
    old_tab_size: The old number of spaces for a single tab.
    new_tab_size: The new number of spaces for a single tab.

    Returns:
    None.
    """

    with open(file_name, "r") as f:
        content = [change_tab_size_on_line(l, old_tab_size, new_tab_size) for l in f]

    with open(file_name, "w") as f:
        for line in content: f.write(line)

if __name__ == "__main__":
  file_name = sys.argv[1]
  old_tab_size = int(sys.argv[2])
  new_tab_size = int(sys.argv[3])

  change_tab_size(file_name, old_tab_size, new_tab_size)