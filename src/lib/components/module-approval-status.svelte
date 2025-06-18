<script lang="ts">
  import type { Approval } from '$lib/types/module-approval'

  let { approvals }: { approvals: Approval[] } = $props()

  let rejectedApprovals = $derived(approvals.filter((a) => a.status.id === 'rejected'))
</script>

{#if rejectedApprovals.length > 0}
  <div class="rounded-md border-l-4 border-l-amber-400 bg-amber-50/50 p-4">
    <div class="flex items-start">
      <div class="flex-shrink-0">
        <svg class="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
      <div class="ml-3 flex-1">
        <h3 class="text-sm font-medium text-amber-800">Anpassungen notwendig</h3>
        <div class="mt-2 text-sm text-amber-700">
          {#each rejectedApprovals as { id, respondedBy, role, studyProgram, comment } (id)}
            <p class="mb-3">
              Ihre Moduländerungen wurden von {respondedBy.firstname}
              {respondedBy.lastname} in der Rolle als {role.deLabel} ({studyProgram.deLabel})
              abgelehnt. Bitte nehmen Sie die angeforderten Änderungen vor:
            </p>
            <div class="rounded border border-amber-200 bg-white p-3">
              {#if comment?.trim()}
                <p class="whitespace-pre-wrap text-sm text-gray-700">{comment}</p>
              {:else}
                <p class="text-sm italic text-gray-500">Kein Kommentar angegeben</p>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
{/if}
