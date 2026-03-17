"""
Replace default admin site with Picks custom admin.
Must run before any app admin modules load.
"""

from django.contrib import admin

from .admin import PicksAdminSite

admin.site = PicksAdminSite()
