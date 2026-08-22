<script lang="ts">
  export let car: any;

  let activeTab = 'general';
  
  let isLoading = false;
  let isDeleting = false;
  let showDeleteConfirm = false;
  let errorMessage = "";
  let successMessage = "";

  // Data bindings (Initialize with existing car data or defaults)
  let title = car.title || "";
  let excerpt = car.excerpt || "";
  let imageAlt = car.imageAlt || "";
  let videoTourUrl = car.videoTourUrl || "";
  let existingImage = car.image || "";
  let files: FileList | null = null;

  let general = car.general || {};
  let history = car.history || {};
  let technical = car.technical || {};
  let efficiency = car.efficiency || {};
  let exterior = car.exterior || {};
  let misc = car.misc || {};

  const tabs = [
    { id: 'general', label: 'General Info' },
    { id: 'technical', label: 'Performance' },
    { id: 'style', label: 'Style & Efficiency' },
    { id: 'media', label: 'Media' },
  ];

  const submitForm = async () => {
    if (!title) {
      errorMessage = "Title is required!";
      return;
    }
    
    isLoading = true;
    errorMessage = "";
    successMessage = "";
    
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("excerpt", excerpt);
      formData.append("imageAlt", imageAlt);
      formData.append("videoTourUrl", videoTourUrl);
      formData.append("image", existingImage); // fallback if no new file
      
      if (files && files.length > 0) {
        formData.append("imageFile", files[0]);
      }
      
      formData.append("general", JSON.stringify(general));
      formData.append("history", JSON.stringify(history));
      formData.append("technical", JSON.stringify(technical));
      formData.append("efficiency", JSON.stringify(efficiency));
      formData.append("exterior", JSON.stringify(exterior));
      formData.append("misc", JSON.stringify(misc));
      
      const response = await fetch(`/api/cars/${car.id}`, {
        method: "PUT",
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to update car");
      }
      
      successMessage = "Vehicle updated successfully!";
      // Optionally redirect: if (data.redirect) window.location.href = data.redirect;
    } catch (err: any) {
      errorMessage = err.message;
    } finally {
      isLoading = false;
    }
  };

  const deleteCar = async () => {
    isDeleting = true;
    errorMessage = "";
    
    try {
      const response = await fetch(`/api/cars/${car.id}`, {
        method: "DELETE"
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete car");
      }
      
      if (data.redirect) {
        window.location.href = data.redirect;
      }
    } catch (err: any) {
      errorMessage = err.message;
      isDeleting = false;
      showDeleteConfirm = false;
    }
  };
</script>

<div class="max-w-5xl mx-auto bg-white text-gray-900 rounded-xl shadow-md overflow-hidden border border-gray-200">
  <!-- Header -->
  <div class="bg-gray-50 p-6 border-b border-gray-200 flex justify-between items-center">
    <div>
      <h2 class="text-xl font-bold text-gray-900">Edit Vehicle</h2>
      <p class="text-gray-500 text-sm mt-1 font-mono">{car.id}</p>
    </div>
    <div class="flex items-center gap-2">
      <div class="px-3 py-1 rounded text-xs font-bold uppercase tracking-widest bg-green-100 text-green-800 border border-green-200">
        Public (Live)
      </div>
    </div>
  </div>

  <!-- Tabs Navigation -->
  <div class="flex border-b border-gray-200 bg-gray-100 overflow-x-auto">
    {#each tabs as tab}
      <button 
        type="button"
        on:click={() => activeTab = tab.id}
        class={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${activeTab === tab.id ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
      >
        {tab.label}
      </button>
    {/each}
  </div>

  <div class="p-8">
    {#if errorMessage}
      <div class="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <span class="font-medium">{errorMessage}</span>
      </div>
    {/if}
    
    {#if successMessage}
      <div class="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <span class="font-medium">{successMessage}</span>
      </div>
    {/if}

    <form on:submit|preventDefault={submitForm}>
      
      <!-- TAB 1: General -->
      <div class={activeTab === 'general' ? 'block animate-fade-in' : 'hidden'}>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="col-span-1 md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Display Title *</label>
            <input type="text" bind:value={title} class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900" required>
          </div>
          
          <div class="col-span-1 md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
            <input type="text" bind:value={excerpt} class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Make</label>
            <input type="text" bind:value={general.make} class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Model</label>
            <input type="text" bind:value={general.model} class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
            <input type="number" bind:value={general.price} class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Sale Price ($) - Optional</label>
            <input type="number" bind:value={general.salePrice} class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Body Type</label>
            <select bind:value={general.bodyType} class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900">
              <option value="SUV">SUV</option>
              <option value="Sedan">Sedan</option>
              <option value="Hatchback">Hatchback</option>
              <option value="Coupe">Coupe</option>
              <option value="Convertible">Convertible</option>
              <option value="Pickup">Pickup</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Availability</label>
            <select bind:value={general.availability} class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900">
              <option value="in-stock">In Stock</option>
              <option value="reserved">Reserved</option>
              <option value="coming-soon">Coming Soon</option>
            </select>
          </div>
          
          <div class="col-span-1 md:col-span-2 pt-4 border-t border-gray-200 mt-2 flex flex-col gap-4">
            <!-- Removed Hidden checkbox -->
            <div>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" bind:checked={misc.loanWidget} class="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                <span class="text-sm font-medium text-gray-900">Enable Loan Calculator Widget</span>
              </label>
              <p class="text-xs text-gray-500 mt-1 ml-8">If checked, a dynamic loan calculator will be rendered on the car's detail page.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: Technical & History -->
      <div class={activeTab === 'technical' ? 'block animate-fade-in' : 'hidden'}>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Model Year</label>
            <input type="number" bind:value={history.year} class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mileage</label>
            <input type="number" bind:value={history.mileage} class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Horsepower (BHP)</label>
            <input type="number" bind:value={technical.horsePower} class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Engine Size (CC)</label>
            <input type="number" bind:value={technical.engineSizeCC} class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Transmission</label>
            <select bind:value={technical.transmission} class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900">
              <option value="Automatic">Automatic</option>
              <option value="Manual">Manual</option>
              <option value="Dual-Clutch">Dual-Clutch</option>
              <option value="CVT">CVT</option>
            </select>
          </div>
        </div>
      </div>

      <!-- TAB 3: Style & Efficiency -->
      <div class={activeTab === 'style' ? 'block animate-fade-in' : 'hidden'}>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
            <select bind:value={efficiency.fuelType} class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900">
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Electric">Electric</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Exterior Color</label>
            <input type="text" bind:value={exterior.color} class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Doors</label>
            <input type="number" bind:value={general.doors} class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Seating</label>
            <input type="number" bind:value={general.seatingCapacity} class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900">
          </div>
        </div>
      </div>

      <!-- TAB 4: Media -->
      <div class={activeTab === 'media' ? 'block animate-fade-in' : 'hidden'}>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Current Image</label>
            {#if existingImage}
              <div class="rounded-lg overflow-hidden border border-gray-700 h-48 bg-gray-100">
                <img src={existingImage} alt="Car thumbnail" class="w-full h-full object-cover opacity-80 hover:opacity-100 transition" />
              </div>
            {:else}
              <div class="rounded-lg border border-gray-700 h-48 bg-gray-100 flex items-center justify-center text-gray-600">
                No image available
              </div>
            {/if}
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Replace Image</label>
            <div class="bg-gray-50 border border-dashed border-gray-300 hover:border-blue-500 rounded-lg h-48 flex flex-col items-center justify-center text-center hover:border-blue-500 transition cursor-pointer relative group">
              <input type="file" bind:files={files} accept="image/*" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
              
              <svg xmlns="http://www.w3.org/2000/svg" class={`h-10 w-10 mx-auto mb-3 transition ${files && files.length ? 'text-blue-500' : 'text-gray-500 group-hover:text-blue-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p class="text-sm font-medium text-gray-400 px-4">{files && files.length ? files[0].name : "Drag & drop to replace"}</p>
            </div>
          </div>
          
          <div class="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Image Alt Text</label>
              <input type="text" bind:value={imageAlt} class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Video Tour URL</label>
              <input type="url" bind:value={videoTourUrl} class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900">
            </div>
          </div>
        </div>
      </div>

      <!-- Actions Footer -->
      <div class="mt-10 flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-gray-200 gap-4">
        
        <!-- Delete Action -->
        {#if showDeleteConfirm}
          <div class="flex items-center gap-3 bg-red-50 p-3 rounded border border-red-200 animate-fade-in w-full sm:w-auto">
            <span class="text-red-700 text-sm font-bold ml-2">Are you sure?</span>
            <button type="button" class="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-1.5 rounded text-sm transition" on:click={() => showDeleteConfirm = false}>Cancel</button>
            <button type="button" on:click={deleteCar} disabled={isDeleting} class="bg-red-700 hover:bg-red-600 text-white px-4 py-1.5 rounded text-sm font-bold transition flex items-center gap-2">
              {#if isDeleting} Wait... {:else} Confirm Delete {/if}
            </button>
          </div>
        {:else}
          <button type="button" class="text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded text-sm font-bold uppercase tracking-wider transition w-full sm:w-auto text-left sm:text-center" on:click={() => showDeleteConfirm = true}>
            Remove Vehicle
          </button>
        {/if}
        
        <button type="submit" disabled={isLoading} class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded font-bold uppercase tracking-wider text-sm transition  disabled:opacity-50 flex items-center gap-2 w-full sm:w-auto justify-center">
          {#if isLoading}
            <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Saving...
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            Save Changes
          {/if}
        </button>
      </div>
    </form>
  </div>
</div>

<style>
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out forwards;
  }
</style>
