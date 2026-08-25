<script lang="ts">
  import { onMount } from 'svelte';

  let currentStep = 1;
  const totalSteps = 4;
  
  let isLoading = false;
  let errorMessage = "";

  // Data bindings
  let title = "";
  let excerpt = "";
  let imageAlt = "";
  let videoTourUrl = "";
  let files: FileList | null = null;

  let general = {
    make: "Toyota",
    model: "Camry",
    price: 25000,
    bodyType: "Sedan",
    doors: 4,
    seatingCapacity: 5,
    availability: "in-stock"
  };

  let history = {
    mileage: 0,
    year: new Date().getFullYear()
  };

  let technical = {
    horsePower: 200,
    transmission: "Automatic",
    engineSizeCC: 2500
  };

  let efficiency = {
    fuelType: "Petrol"
  };

  let exterior = {
    color: "Black"
  };

  let misc = {
    hidden: false
  };

  const nextStep = () => {
    if (currentStep < totalSteps) currentStep++;
  };

  const prevStep = () => {
    if (currentStep > 1) currentStep--;
  };

  const submitForm = async () => {
    if (!title) {
      errorMessage = "Title is required!";
      return;
    }
    
    isLoading = true;
    errorMessage = "";
    
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("excerpt", excerpt);
      formData.append("imageAlt", imageAlt);
      formData.append("videoTourUrl", videoTourUrl);
      
      if (files && files.length > 0) {
        formData.append("imageFile", files[0]);
      }
      
      formData.append("general", JSON.stringify(general));
      formData.append("history", JSON.stringify(history));
      formData.append("technical", JSON.stringify(technical));
      formData.append("efficiency", JSON.stringify(efficiency));
      formData.append("exterior", JSON.stringify(exterior));
      formData.append("misc", JSON.stringify(misc));
      
      const response = await fetch("/api/cars", {
        method: "POST",
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to save car");
      }
      
      if (data.redirect) {
        window.location.href = data.redirect;
      }
    } catch (err: any) {
      errorMessage = err.message;
      isLoading = false;
    }
  };
</script>

<div class="max-w-4xl mx-auto bg-white text-gray-900 rounded-xl shadow-md overflow-hidden border border-gray-200">
  <!-- Progress Header -->
  <div class="bg-gray-50 p-6 border-b border-gray-200">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold text-gray-900">Add New Vehicle</h2>
      <div class="text-sm font-medium text-gray-500">
        Step {currentStep} of {totalSteps}
      </div>
    </div>
    
    <!-- Progress Bar -->
    <div class="w-full bg-gray-200 rounded-full h-1.5 mt-4 overflow-hidden relative">
      <div 
        class="bg-blue-600 h-1.5 rounded-full transition-all duration-300 ease-in-out" 
        style="width: {(currentStep / totalSteps) * 100}%"
      ></div>
    </div>
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

    <form on:submit|preventDefault={submitForm}>
      
      <!-- STEP 1: Basic & General -->
      <div class={currentStep === 1 ? 'block animate-fade-in' : 'hidden'}>
        <h3 class="text-lg font-semibold mb-6 text-gray-900 flex items-center border-b pb-2">
          <span class="bg-blue-600 w-1.5 h-5 mr-3 block rounded"></span> General Information
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="col-span-1 md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Display Title *</label>
            <input type="text" bind:value={title} class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900" placeholder="e.g. 2026 Porsche 911 Turbo S" required>
          </div>
          
          <div class="col-span-1 md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
            <input type="text" bind:value={excerpt} class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900" placeholder="Short description for cards...">
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

          <div class="col-span-1 md:col-span-2 pt-4 border-t border-gray-200 mt-2 flex flex-col gap-4">
            <div>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" bind:checked={misc.hidden} class="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                <span class="text-sm font-medium text-gray-900">Create as Hidden (Draft)</span>
              </label>
              <p class="text-xs text-gray-500 mt-1 ml-8">If checked, this car will not appear on the main website until you edit it and unhide it.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- STEP 2: Technical & History -->
      <div class={currentStep === 2 ? 'block animate-fade-in' : 'hidden'}>
        <h3 class="text-lg font-semibold mb-6 text-gray-900 flex items-center border-b pb-2">
          <span class="bg-blue-600 w-1.5 h-5 mr-3 block rounded"></span> Performance & History
        </h3>
        
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

      <!-- STEP 3: Styling & Efficiency -->
      <div class={currentStep === 3 ? 'block animate-fade-in' : 'hidden'}>
        <h3 class="text-lg font-semibold mb-6 text-gray-900 flex items-center border-b pb-2">
          <span class="bg-blue-600 w-1.5 h-5 mr-3 block rounded"></span> Configuration
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Bahan Bakar</label>
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

      <!-- STEP 4: Media -->
      <div class={currentStep === 4 ? 'block animate-fade-in' : 'hidden'}>
        <h3 class="text-lg font-semibold mb-6 text-gray-900 flex items-center border-b pb-2">
          <span class="bg-blue-600 w-1.5 h-5 mr-3 block rounded"></span> Media & Finalize
        </h3>
        
        <div class="grid grid-cols-1 gap-6">
          <div class="bg-gray-50 border border-dashed border-gray-300 hover:border-blue-500 rounded-lg p-8 text-center hover:border-blue-500 transition cursor-pointer relative">
            <input type="file" bind:files={files} accept="image/*" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
            
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p class="text-gray-400 font-medium">{files && files.length ? files[0].name : "Drag and drop main image here, or click to browse"}</p>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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

      <!-- Footer Nav -->
      <div class="mt-10 flex items-center justify-between pt-6 border-t border-gray-200">
        <button type="button" class="px-6 py-2.5 rounded font-bold uppercase tracking-wider text-sm transition {currentStep === 1 ? 'opacity-0 pointer-events-none' : 'text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200'}" on:click={prevStep}>
          &larr; Previous
        </button>
        
        {#if currentStep < totalSteps}
          <button type="button" class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded font-semibold transition" on:click={nextStep}>
            Continue &rarr;
          </button>
        {:else}
          <button type="submit" disabled={isLoading} class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded font-semibold transition disabled:opacity-50 flex items-center gap-2">
            {#if isLoading}
              <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              Deploy Vehicle
            {/if}
          </button>
        {/if}
      </div>
    </form>
  </div>
</div>

<style>
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fadeIn 0.4s ease-out forwards;
  }
</style>
