# => Example 28 package root: curates the public surface.
from shapes.circle import area as circle_area  # => WHY re-export: one import root
from shapes.square import area as square_area  # => both members behind the package

__all__ = ["circle_area", "square_area"]  # => WHY all: documents the surface
