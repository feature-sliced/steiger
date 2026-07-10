import { expect, it, vi } from 'vitest'

import { createMockedNodeFs } from './mock-node-fs.js'

vi.mock('node:fs', () =>
  createMockedNodeFs({
    '/src/App.svelte': `
      <script>
        // [Learn1]Imports content from another Svelte file.
        // SvelteKit automatically makes files under "src/lib" available using the "$lib" import alias.(https://svelte.dev/docs/kit/$lib)
        import Hello from '$lib/components/Hello.svelte'
        import Counter from '$lib/components/Counter.svelte';
        let name = "+page.svelte"
        let isActive = false

        // [Learn2]Declare functions
        // In most JS/TS projects, it is a standard practice to declare functions using const
        const change_name = () => {
          name = "DS2Man"
          isActive = true
        }
      </script>

      <main>
        <!--
          [Learn3]Svelte Directive Type : Class Directive
          1. Use curly braces to insert declared variables
          2. This is an example where the class is applied conditionally based on a boolean value
        -->
        <h1 class:myactive={isActive}>
          This is {name}!
        </h1>

        <!--
          [Learn4]How to binding, One-way, Two-Way
          1. Same as above, use curly braces to insert variables (no need for quotes)
          2. This is an example of one-way data binding.
             For two-way binding, you need to use \`bind:\`.
          <input type="text" value={name}/>
        -->
        <input type="text" bind:value={name}/>

        <!--
          [Learn5]Event Handling
        -->
        <button
          class="mybox"
          style:background-color={isActive ? 'red' : 'orange'}
          on:click={change_name}
          on:mouseenter={()=>{name="DS2Man"}}
          on:mouseleave={()=>{name="App.svelte"}}>
          click!
        </button>

        <!-- Renders the Hello component -->
        <Hello />
        <!-- Renders the Counter component -->
        <Counter />
      </main>

      <style>
        h1.myactive {
          color: blue;
        }
      </style>
  `,
  }),
)

import { extractDependencies } from './index.js'

it('extracts esm dependencies from Svelte source code', async () => {
  const dependencies = await extractDependencies('/src/App.svelte')
  expect(dependencies).toEqual(['$lib/components/Hello.svelte', '$lib/components/Counter.svelte'])
})
