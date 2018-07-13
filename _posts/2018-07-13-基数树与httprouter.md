---
title: 基数树与httprouter
date: 2018-07-13
layout: post
tags: [数据结构 算法 树 go]
---

基数树即压缩[前缀树](https://zh.wikipedia.org/wiki/%E5%89%8D%E7%BC%80%E6%A0%91), 在前缀树的基础上，通过合并唯一子树与其父节点来节约空间，基数树常应用于关联数组、IP 路由、信息检索中，在基数树中查找的时间复杂度取决于数据的最大长度K, 时间复杂度为O(K)。

一棵基数树：

![radix tree](https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Patricia_trie.svg/400px-Patricia_trie.svg.png)

在基数树中进行字符串查找：

![search in radix tree](https://upload.wikimedia.org/wikipedia/commons/6/63/An_example_of_how_to_find_a_string_in_a_Patricia_trie.png)

通过基数树可以提高字符顺序匹配的效率，对于URL之类的字符使用基数树来进行归类、匹配非常适合，Golang现在普遍使用的URL路由库[httprouter](https://github.com/julienschmidt/httprouter)就是通过构造基数树进行路由的添加和匹配查找。

* httprouter对基数树节点的定义

```go
type node struct {
 // 每个节点的匹配路径
	path      string
  
  // 是否为参数节点(path中包含*,:)
	wildChild bool
  
  // 节点类型
  // static: 静态节点，进行普通匹配
  // root： 根节点
	// param： 参数节点(:)
	// catchAll：以*匹配的接口
	nType     nodeType
  
  // 节点路径的最大参数个数
	maxParams uint8
  
  // 保存节点与子节点的分裂的第一个字符
  // 如aboutme，与aboutteam两个路径，同属于about节点，但是后续会跟随me， team两个子节点
  // 此时indices就是"mt"
	indices   string
  
  // 子节点
	children  []*node
  
  // http请求处理方法
	handle    Handle
  
  // 节点权重（子节点的handler总数），这是httprouter为提高查找性能做的优化
	priority  uint32
}
```

* 基数树的构造

httprouter中构造基数数的核心方法是`addRoute`, 其公共方法`Get`, `Post`只是对`addRoute`的一个调用。

```go
func (n *node) addRoute(path string, handle Handle) {
	fullPath := path
	n.priority++
	numParams := countParams(path)

	// non-empty tree
	if len(n.path) > 0 || len(n.children) > 0 {
	walk:
		for {
			// Update maxParams of the current node
			if numParams > n.maxParams {
				n.maxParams = numParams
			}

			// 查找当前节点路径与将要匹配路径的最长公共前缀，并记录下索引位置
			i := 0
			max := min(len(path), len(n.path))
			for i < max && path[i] == n.path[i] {
				i++
			}

			// 如果当前节点的路径不是新加入路径的最长公共前缀
			// 从该节点分裂出一个子节点
			if i < len(n.path) {
				child := node{
					path:      n.path[i:],
					wildChild: n.wildChild,
					nType:     static,
					indices:   n.indices,
					children:  n.children,
					handle:    n.handle,
					priority:  n.priority - 1,
				}

				// Update maxParams (max of all children)
				for i := range child.children {
					if child.children[i].maxParams > child.maxParams {
						child.maxParams = child.children[i].maxParams
					}
				}

				n.children = []*node{&child}
				// []byte for proper unicode char conversion, see #65
				n.indices = string([]byte{n.path[i]})
				n.path = path[:i]
				n.handle = nil
				n.wildChild = false
			}

			// 将新路径作为子节点插入当前节点
			if i < len(path) {
				// 记录最大前缀匹配位置后的字符串，以便继续向下匹配
				path = path[i:]

				// 公共节点是一个参数节点，说明在前面的最长前缀匹配时匹配时两个路径类似:path, :path/rest/path
				// 这是继续需要进行从子节点匹配
				if n.wildChild {
					n = n.children[0]
					n.priority++

					// Update maxParams of the child node
					if numParams > n.maxParams {
						n.maxParams = numParams
					}
					numParams--

					// Check if the wildcard matches
					// 判断子节点（n）与后续路径是否存在匹配，如/rest, /rest/, 否则表示路径存在冲突
					if len(path) >= len(n.path) && n.path == path[:len(n.path)] &&
						// Check for longer wildcard, e.g. :name and :names
						(len(n.path) >= len(path) || path[len(n.path)] == '/') {
						continue walk
					} else {
						// Wildcard conflict
						var pathSeg string
						if n.nType == catchAll {
							pathSeg = path
						} else {
							pathSeg = strings.SplitN(path, "/", 2)[0]
						}
						prefix := fullPath[:strings.Index(fullPath, pathSeg)] + n.path
						panic("'" + pathSeg +
							"' in new path '" + fullPath +
							"' conflicts with existing wildcard '" + n.path +
							"' in existing prefix '" + prefix +
							"'")
					}
				}

				c := path[0]

				// slash after param
				if n.nType == param && c == '/' && len(n.children) == 1 {
					n = n.children[0]
					n.priority++
					continue walk
				}

				// 通过indices与后续路径的首字母比较，可以知道后续应该从哪个子节点进行匹配插入
				// Check if a child with the next path byte exists
				for i := 0; i < len(n.indices); i++ {
					if c == n.indices[i] {
						i = n.incrementChildPrio(i)
						n = n.children[i]
						continue walk
					}
				}

				// Otherwise insert it
				if c != ':' && c != '*' {
					// []byte for proper unicode char conversion, see #65
					n.indices += string([]byte{c})
					child := &node{
						maxParams: numParams,
					}
					n.children = append(n.children, child)
					n.incrementChildPrio(len(n.indices) - 1)
					n = child
				}
				n.insertChild(numParams, path, fullPath, handle)
				return

			} else if i == len(path) { // Make node a (in-path) leaf
				if n.handle != nil {
					panic("a handle is already registered for path '" + fullPath + "'")
				}
				n.handle = handle
			}
			return
		}
	} else {
		// Empty tree
		// 添加根节点
		n.insertChild(numParams, path, fullPath, handle)
		n.nType = root
	}
}
```

通过路径生成的基数树类似

```
Priority   Path             Handle
9          \                *<1>
3          ├s               nil
2          |├earch\         *<2>
1          |└upport\        *<3>
2          ├blog\           *<4>
1          |    └:post      nil
1          |         └\     *<5>
2          ├about-us\       *<6>
1          |        └team\  *<7>
1          └contact\        *<8>
```

* 路由的匹配

```go
// Returns the handle registered with the given path (key). The values of
// wildcards are saved to a map.
// If no handle can be found, a TSR (trailing slash redirect) recommendation is
// made if a handle exists with an extra (without the) trailing slash for the
// given path.
func (n *node) getValue(path string) (handle Handle, p Params, tsr bool) {
walk: // outer loop for walking the tree
	for {
		if len(path) > len(n.path) {
			// 前缀匹配
			if path[:len(n.path)] == n.path {
				path = path[len(n.path):]
				// If this node does not have a wildcard (param or catchAll)
				// child,  we can just look up the next child node and continue
				// to walk down the tree
				// 找到下一步要匹配的子节点
				if !n.wildChild {
					c := path[0]
					for i := 0; i < len(n.indices); i++ {
						if c == n.indices[i] {
							n = n.children[i]
							continue walk
						}
					}

					// Nothing found.
					// We can recommend to redirect to the same URL without a
					// trailing slash if a leaf exists for that path.
					tsr = (path == "/" && n.handle != nil)
					return

				}

				// handle wildcard child
				n = n.children[0]
				switch n.nType {
				case param:
					// find param end (either '/' or path end)
					end := 0
					for end < len(path) && path[end] != '/' {
						end++
					}

					// save param value
					if p == nil {
						// lazy allocation
						p = make(Params, 0, n.maxParams)
					}
					i := len(p)
					p = p[:i+1] // expand slice within preallocated capacity
					p[i].Key = n.path[1:]
					p[i].Value = path[:end]

					// we need to go deeper!
					if end < len(path) {
						if len(n.children) > 0 {
							path = path[end:]
							n = n.children[0]
							continue walk
						}

						// ... but we can't
						tsr = (len(path) == end+1)
						return
					}

					if handle = n.handle; handle != nil {
						return
					} else if len(n.children) == 1 {
						// No handle found. Check if a handle for this path + a
						// trailing slash exists for TSR recommendation
						n = n.children[0]
						tsr = (n.path == "/" && n.handle != nil)
					}

					return

				case catchAll:
					// save param value
					if p == nil {
						// lazy allocation
						p = make(Params, 0, n.maxParams)
					}
					i := len(p)
					p = p[:i+1] // expand slice within preallocated capacity
					p[i].Key = n.path[2:]
					p[i].Value = path

					handle = n.handle
					return

				default:
					panic("invalid node type")
				}
			}
		} else if path == n.path {
			// We should have reached the node containing the handle.
			// Check if this node has a handle registered.
			if handle = n.handle; handle != nil {
				return
			}

			if path == "/" && n.wildChild && n.nType != root {
				tsr = true
				return
			}

			// No handle found. Check if a handle for this path + a
			// trailing slash exists for trailing slash recommendation
			for i := 0; i < len(n.indices); i++ {
				if n.indices[i] == '/' {
					n = n.children[i]
					tsr = (len(n.path) == 1 && n.handle != nil) ||
						(n.nType == catchAll && n.children[0].handle != nil)
					return
				}
			}

			return
		}

		// Nothing found. We can recommend to redirect to the same URL with an
		// extra trailing slash if a leaf exists for that path
		tsr = (path == "/") ||
			(len(n.path) == len(path)+1 && n.path[len(path)] == '/' &&
				path == n.path[:len(n.path)-1] && n.handle != nil)
		return
	}
}
```

路由匹配就是基本的前缀匹配，在匹配过程中同时记录路径参数。

httprouter为了提高扩展性和性能，通过priority值对整个树的节点进行优先级排序，保证被最多路径包含的节点最先进行匹配，最长路径的节点最先被评估（从上到下，从左到右的顺序）。

