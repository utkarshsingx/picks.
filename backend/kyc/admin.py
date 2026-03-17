from django.contrib import admin
from django.utils.html import format_html

from .models import KycDocument


@admin.register(KycDocument)
class KycDocumentAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'document_type', 'status', 'file_link', 'uploaded_at', 'reviewed_at')
    list_filter = ('document_type', 'status')
    search_fields = ('user__email',)
    readonly_fields = ('uploaded_at', 'file_preview')
    date_hierarchy = 'uploaded_at'

    def file_link(self, obj):
        if obj.file:
            return format_html('<a href="{}" target="_blank">View</a>', obj.file.url)
        return '-'

    file_link.short_description = 'File'

    def file_preview(self, obj):
        if obj.file:
            return format_html('<a href="{}" target="_blank">View document</a>', obj.file.url)
        return '-'

    file_preview.short_description = 'Preview'
