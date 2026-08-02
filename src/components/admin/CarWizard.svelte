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

<div class="max-w-4xl mx-auto bg-[#1a1a1a] text-gray-200 rounded-xl shadow-2xl overflow-hidden border border-gray-800">
  <!-- Progress Header -->
  <div class="bg-gradient-to-r from-red-900 via-red-800 to-red-900 p-6 border-b border-red-700">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-black uppercase tracking-wider text-white">Add New Vehicle</h2>
      <div class="text-sm font-bold text-red-200 tracking-widest uppercase">
        Step {currentStep} of {totalSteps}
      </div>
    </div>
    
    <!-- Progress Bar -->
    <div class="w-full bg-gray-900 rounded-full h-1.5 mt-4 overflow-hidden relative">
      <div 
        class="bg-red-500 h-1.5 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.7)] transition-all duration-300 ease-in-out" 
        style="width: {(currentStep / totalSteps) * 100}%"
      ></div>
    </div>
  </div>

  <div class="p-8">
    {#if errorMessage}
      <div class="mb-6 p-4 bg-red-950 border border-red-800 text-red-400 rounded-lg flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <span class="font-medium">{errorMessage}</span>
      </div>
    {/if}

    <form on:submit|preventDefault={submitForm}>
      
      <!-- STEP 1: Basic & General -->
      <div class={currentStep === 1 ? 'block animate-fade-in' : 'hidden'}>
        <h3 class="text-xl font-bold mb-6 text-gray-100 flex items-center">
          <span class="bg-red-600 w-2 h-6 mr-3 block"></span> General Information
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="col-span-1 md:col-span-2">
            <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Display Title *</label>
            <input type="text" bind:value={title} class="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition" placeholder="e.g. 2026 Porsche 911 Turbo S" required>
          </div>
          
          <div class="col-span-1 md:col-span-2">
            <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Excerpt</label>
            <input type="text" bind:value={excerpt} class="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition" placeholder="Short description for cards...">
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Make</label>
            <input type="text" bind:value={general.make} class="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition">
          </div>
          
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Model</label>
            <input type="text" bind:value={general.model} class="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition">
          </div>
          
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Price ($)</label>
            <input type="number" bind:value={general.price} class="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition">
          </div>
          
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Body Type</label>
            <select bind:value={general.bodyType} class="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition">
              <option value="SUV">SUV</option>
              <option value="Sedan">Sedan</option>
              <option value="Hatchback">Hatchback</option>
              <option value="Coupe">Coupe</option>
              <option value="Convertible">Convertible</option>
              <option value="Pickup">Pickup</option>
            </select>
          </div>
        </div>
      </div>

      <!-- STEP 2: Technical & History -->
      <div class={currentStep === 2 ? 'block animate-fade-in' : 'hidden'}>
        <h3 class="text-xl font-bold mb-6 text-gray-100 flex items-center">
          <span class="bg-red-600 w-2 h-6 mr-3 block"></span> Performance & History
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Model Year</label>
            <input type="number" bind:value={history.year} class="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition">
          </div>
          
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Mileage</label>
            <input type="number" bind:value={history.mileage} class="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition">
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Horsepower (BHP)</label>
            <input type="number" bind:value={technical.horsePower} class="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition">
          </div>
          
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Engine Size (CC)</label>
            <input type="number" bind:value={technical.engineSizeCC} class="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition">
          </div>
          
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Transmission</label>
            <select bind:value={technical.transmission} class="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition">
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
        <h3 class="text-xl font-bold mb-6 text-gray-100 flex items-center">
          <span class="bg-red-600 w-2 h-6 mr-3 block"></span> Configuration
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Fuel Type</label>
            <select bind:value={efficiency.fuelType} class="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition">
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Electric">Electric</option>
            </select>
          </div>
          
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Exterior Color</label>
            <input type="text" bind:value={exterior.color} class="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition">
          </div>
          
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Doors</label>
            <input type="number" bind:value={general.doors} class="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition">
          </div>
          
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Seating</label>
            <input type="number" bind:value={general.seatingCapacity} class="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition">
          </div>
        </div>
      </div>

      <!-- STEP 4: Media -->
      <div class={currentStep === 4 ? 'block animate-fade-in' : 'hidden'}>
        <h3 class="text-xl font-bold mb-6 text-gray-100 flex items-center">
          <span class="bg-red-600 w-2 h-6 mr-3 block"></span> Media & Finalize
        </h3>
        
        <div class="grid grid-cols-1 gap-6">
          <div class="bg-gray-900 border border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-red-500 transition cursor-pointer relative">
            <input type="file" bind:files={files} accept="image/*" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
            
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p class="text-gray-400 font-medium">{files && files.length ? files[0].name : "Drag and drop main image here, or click to browse"}</p>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Image Alt Text</label>
              <input type="text" bind:value={imageAlt} class="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition">
            </div>
            
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Video Tour URL</label>
              <input type="url" bind:value={videoTourUrl} class="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition">
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Nav -->
      <div class="mt-10 flex items-center justify-between pt-6 border-t border-gray-800">
        <button type="button" class="px-6 py-2.5 rounded font-bold uppercase tracking-wider text-sm transition {currentStep === 1 ? 'opacity-0 pointer-events-none' : 'text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700'}" on:click={prevStep}>
          &larr; Previous
        </button>
        
        {#if currentStep < totalSteps}
          <button type="button" class="bg-red-600 hover:bg-red-500 text-white px-8 py-2.5 rounded font-bold uppercase tracking-wider text-sm transition shadow-[0_0_15px_rgba(239,68,68,0.4)]" on:click={nextStep}>
            Continue &rarr;
          </button>
        {:else}
          <button type="submit" disabled={isLoading} class="bg-red-600 hover:bg-red-500 text-white px-8 py-2.5 rounded font-bold uppercase tracking-wider text-sm transition shadow-[0_0_15px_rgba(239,68,68,0.4)] disabled:opacity-50 flex items-center gap-2">
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
