<template>
  <div class="bg-black h-screen flex justify-center gap-8">
    <div class="bg-white p-8 rounded-4xl flex flex-col w-[500px] max-h-fit">
      <div class="relative">
        <div
          class="absolute top-0 left-0 p-3 bg-blue-600 border-2 border-blue-700 rounded-4xl max-w-fit font-bold text-white text-7xl"
          id="energy"
        >
          7
        </div>
        <div
          class="absolute top-0 right-0 p-3 bg-amber-500 border-2 border-amber-700 rounded-4xl max-w-fit font-bold text-white text-7xl"
          id="cost"
        >
          7
        </div>
        <img
          class="w-full"
          id="cover"
          src="https://www.dndbeyond.com/avatars/thumbnails/30834/160/1000/1000/638063882785865067.png"
        />
      </div>

      <h1 class="text-5xl font-black" id="name">Орк</h1>
      <div class="p-2 mb-3" id="health">
        <img
          class="relative z-10 left-[-10px] top-[50%] w-[60px]"
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Heart_coraz%C3%B3n.svg/3840px-Heart_coraz%C3%B3n.svg.png?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=thumbnail"
        />
        <div
          class="bg-amber-700 w-full h-[20px] rounded-2xl text-center justify-center align-middle font-black"
        >
          1000HP
        </div>
      </div>
      <div class="flex flex-row gap-4">
        <div
          class="bg-gray-200 border-gray-400 border-2 rounded-xl p-4 w-full flex flex-row align-middle"
          id="attack"
        >
          <img class="h-[40px]" src="https://svgsilh.com/svg_v2/312440.svg" />
          <div>attack: 40</div>
        </div>
        <div
          class="bg-gray-200 border-gray-400 border-2 rounded-xl p-4 w-full flex flex-row align-middle"
          id="defence"
        >
          <img
            class="h-[40px]"
            src="https://img.freepik.com/premium-vector/sheild-silhouette-vector_706941-4755.jpg?semt=ais_hybrid&w=740&q=80"
          />
          <div>defence: 40</div>
        </div>
      </div>
      <div class="flex flex-row gap-3.5" id="dnd-stats">
        <div
          class="flex flex-col relative items-center p-4 flex-1 border-2 rounded-xl"
        >
          <div>str</div>
          <div class="text-lg font-bold">10</div>
          <div class="absolute top-[80%] p-1 border-2 rounded-3xl bg-white">
            -10
          </div>
        </div>
        <div
          class="flex flex-col relative items-center p-4 flex-1 border-2 rounded-xl"
        >
          <div>str</div>
          <div class="text-lg font-bold">10</div>
          <div class="absolute top-[80%] p-1 border-2 rounded-3xl bg-white">
            -10
          </div>
        </div>
        <div
          class="flex flex-col relative items-center p-4 flex-1 border-2 rounded-xl"
        >
          <div>str</div>
          <div class="text-lg font-bold">10</div>
          <div class="absolute top-[80%] p-1 border-2 rounded-3xl bg-white">
            -10
          </div>
        </div>
        <div
          class="flex flex-col relative items-center p-4 flex-1 border-2 rounded-xl"
        >
          <div>str</div>
          <div class="text-lg font-bold">10</div>
          <div class="absolute top-[80%] p-1 border-2 rounded-3xl bg-white">
            -10
          </div>
        </div>
      </div>
      <table class="table-auto">
        <thead>
          <tr>
            <th>Song</th>
            <th>Artist</th>
            <th>Year</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>The Sliding Mr. Bones (Next Stop, Pottersville)</td>
            <td>Malcolm Lockyer</td>
            <td>1961</td>
          </tr>
          <tr>
            <td>Witchy Woman</td>
            <td>The Eagles</td>
            <td>1972</td>
          </tr>
          <tr>
            <td>Shining Star</td>
            <td>Earth, Wind, and Fire</td>
            <td>1975</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
